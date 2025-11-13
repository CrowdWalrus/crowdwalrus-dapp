# Donation Transaction Error - Issue Report

## Overview

This document describes an error occurring when attempting to execute a donation transaction that integrates with Pyth Network's price oracle on Sui blockchain. The transaction fails during the dry run phase with a specific error related to argument passing.

## Error Message

```
Dry run failed, could not automatically determine a budget: CommandArgumentError { arg_idx: 7, kind: InvalidArgumentToPrivateEntryFunction } in command 7
```

## Context

The donation flow requires:
1. Fetching a fresh price update from Pyth Network's Hermes service
2. Updating the on-chain Pyth price feed via a Programmable Transaction Block (PTB)
3. Calling the donation function with the updated price feed object

All of this happens in a single PTB (Programmable Transaction Block).

## Move Contract Code

### Donation Entry Function (donations.move)

```move
/// First-time donation flow for users without a profile. Creates a new profile as a side effect.
///
/// # Type parameters
/// - `T`: The coin type for the donation (e.g., `0x2::sui::SUI`).
///
/// # Parameters
/// - `campaign`: The campaign receiving the donation (mutable).
/// - `stats`: The campaign's aggregated stats object (mutable).
/// - `registry`: The platform's token registry (immutable).
/// - `badge_config`: The badge reward configuration (immutable).
/// - `profiles_registry`: The global profiles registry (mutable, to mint a new profile).
/// - `clock`: Sui's clock object for timestamps and staleness checks.
/// - `donation`: The coin being donated.
/// - `price_info_object`: The Pyth price feed object for T's price (immutable).
/// - `expected_min_usd_micro`: Minimum acceptable USD micro-value (slippage protection).
/// - `opt_max_age_ms`: Optional override for the price staleness window; if `none()`, uses the token registry's `max_age_ms`.
///
/// # Aborts
/// - `profiles::profile_exists_error_code()`: Sender already has a profile (use `donate_and_award` instead).
/// - All other abort paths surfaced by `donate<T>` (time window, token disabled, slippage, stale price, etc.).
entry fun donate_and_award_first_time<T>(
    campaign: &mut campaign::Campaign,
    stats: &mut campaign_stats::CampaignStats,
    registry: &token_registry::TokenRegistry,
    badge_config: &badge_rewards::BadgeConfig,
    profiles_registry: &mut profiles::ProfilesRegistry,
    clock: &Clock,
    donation: Coin<T>,
    price_info_object: &pyth::price_info::PriceInfoObject,
    expected_min_usd_micro: u64,
    opt_max_age_ms: std::option::Option<u64>,
    ctx: &mut sui::tx_context::TxContext,
): DonationAwardOutcome {
    let sender = sui::tx_context::sender(ctx);
    assert!(
        !profiles::exists(profiles_registry, sender),
        profiles::profile_exists_error_code(),
    );

    let mut profile = profiles::create_for(profiles_registry, sender, clock, ctx);
    let old_amount = profiles::total_usd_micro(&profile);

    let usd_micro = donate<T>(
        campaign,
        stats,
        registry,
        clock,
        donation,
        price_info_object,
        expected_min_usd_micro,
        opt_max_age_ms,
        ctx,
    );

    profiles::increment_total_usd_micro(&mut profile, usd_micro);
    profiles::increment_total_donations_count(&mut profile);
    let minted_levels = badge_rewards::award_if_new_levels(badge_config, &mut profile, old_amount);
    sui::transfer::public_transfer(profile, sender);

    DonationAwardOutcome { usd_micro, minted_levels }
}

/// Repeat donation flow for users who already have a profile.
///
/// # Type parameters
/// - `T`: The coin type for the donation.
///
/// # Parameters
/// - `campaign`: The campaign receiving the donation (mutable).
/// - `stats`: The campaign's aggregated stats object (mutable).
/// - `registry`: The platform's token registry (immutable).
/// - `badge_config`: The badge reward configuration (immutable).
/// - `clock`: Sui's clock object for timestamps and staleness checks.
/// - `profile`: The donor's existing profile object (mutable).
/// - `donation`: The coin being donated.
/// - `price_info_object`: The Pyth price feed object for T's price (immutable).
/// - `expected_min_usd_micro`: Minimum acceptable USD micro-value (slippage protection).
/// - `opt_max_age_ms`: Optional override for the price staleness window; if `none()`, uses the token registry's `max_age_ms`.
///
/// # Aborts
/// - `profiles::not_owner_error_code()`: The sender does not own this profile.
/// - All other abort paths surfaced by `donate<T>` (time window, token disabled, slippage, stale price, etc.).
entry fun donate_and_award<T>(
    campaign: &mut campaign::Campaign,
    stats: &mut campaign_stats::CampaignStats,
    registry: &token_registry::TokenRegistry,
    badge_config: &badge_rewards::BadgeConfig,
    clock: &Clock,
    profile: &mut profiles::Profile,
    donation: Coin<T>,
    price_info_object: &pyth::price_info::PriceInfoObject,
    expected_min_usd_micro: u64,
    opt_max_age_ms: std::option::Option<u64>,
    ctx: &mut sui::tx_context::TxContext,
): DonationAwardOutcome {
    let sender = sui::tx_context::sender(ctx);
    assert!(
        profiles::owner(profile) == sender,
        profiles::not_owner_error_code(),
    );

    let old_amount = profiles::total_usd_micro(profile);

    let usd_micro = donate<T>(
        campaign,
        stats,
        registry,
        clock,
        donation,
        price_info_object,
        expected_min_usd_micro,
        opt_max_age_ms,
        ctx,
    );

    profiles::increment_total_usd_micro(profile, usd_micro);
    profiles::increment_total_donations_count(profile);
    let minted_levels = badge_rewards::award_if_new_levels(badge_config, profile, old_amount);

    DonationAwardOutcome { usd_micro, minted_levels }
}
```

**Key observation**: Both functions declare `price_info_object: &pyth::price_info::PriceInfoObject` (immutable reference).

## TypeScript Frontend Code

### Price Oracle Service (priceOracle.ts)

```typescript
export async function attachPriceOracleQuote({
  network,
  token,
  suiClient,
  transaction,
  rawAmount,
}: PriceOracleQuoteOptions): Promise<PriceOracleQuoteResult> {
  if (rawAmount <= 0n) {
    throw new Error("Donation amount must be greater than zero.");
  }
  if (!token.pythFeedId) {
    throw new Error("Token registry entry is missing a Pyth feed id.");
  }
  if (token.decimals < 0 || token.decimals > MAX_DECIMALS) {
    throw new Error("Token decimals exceed supported precision.");
  }
  if (token.pythFeedId.length !== 66) {
    throw new Error(
      `Invalid Pyth feed id length for ${token.symbol}. Expected 66 chars, received ${token.pythFeedId.length}.`,
    );
  }

  const config = getContractConfig(network);
  const hermes = getHermesConnection(config.pyth.hermesUrl);
  const feedId = token.pythFeedId.toLowerCase() as HexString;

  const [latestPriceUpdate, priceUpdateData] = await Promise.all([
    hermes.getLatestPriceUpdates([feedId], { parsed: true }),
    hermes.getPriceFeedsUpdateData([feedId]),
  ]);
  if (!priceUpdateData.length) {
    throw new Error(
      "Hermes returned no price update data for the requested feed.",
    );
  }

  const parsedPrice = extractParsedPrice(latestPriceUpdate, feedId);
  const publishTimeMs = parsedPrice.price.publish_time * 1000;
  const nowMs = Date.now();
  // Fail fast for stale prices; Move re-validates using the on-chain Clock.
  if (token.maxAgeMs > 0 && nowMs - publishTimeMs > token.maxAgeMs) {
    throw new Error(
      `Latest ${token.symbol} price (${new Date(publishTimeMs).toISOString()}) exceeds max_age_ms (${token.maxAgeMs}ms).`,
    );
  }

  const quotedUsdMicro = quoteUsdFromPrice(
    rawAmount,
    token.decimals,
    parsedPrice.price.price,
    parsedPrice.price.expo,
  );

  if (quotedUsdMicro > MAX_U64) {
    throw new Error("USD quote exceeds Move u64 range.");
  }

  const pythClient = new CrowdWalrusPythClient(
    suiClient,
    config.pyth.pythStateId,
    config.pyth.wormholeStateId,
  );
  const priceInfoObjectIds = await pythClient.updatePriceFeeds(
    transaction,
    priceUpdateData,
    [feedId],
  );

  if (!priceInfoObjectIds.length || !priceInfoObjectIds[0]) {
    throw new Error("Pyth SDK returned no price info objects to reference.");
  }
  const priceInfoObjectArg = await pythClient.buildSharedObjectArg(
    transaction,
    priceInfoObjectIds[0],
    false,
  );

  return {
    priceInfoObject: priceInfoObjectArg,
    quotedUsdMicro,
    publishTimeMs,
    feedId,
    registryMaxAgeMs: token.maxAgeMs,
  };
}
```

### Custom Pyth Client (pythClient.ts)

```typescript
export class CrowdWalrusPythClient extends SuiPythClient {
  private sharedMetadataCache = new Map<string, SharedObjectMetadata>();
  private packageIdCache = new Map<string, string>();
  private resolvedPythPackageId?: string;
  private cachedWormholePackageId?: string;

  constructor(provider: SuiClient, pythStateId: string, wormholeStateId: string) {
    super(provider, pythStateId, wormholeStateId);
  }

  private async getSharedMetadata(objectId: string): Promise<SharedObjectMetadata> {
    const cached = this.sharedMetadataCache.get(objectId);
    if (cached) {
      return cached;
    }
    const { data } = await this.provider.getObject({
      id: objectId,
      options: { showOwner: true },
    });
    const owner = data?.owner;
    if (!owner || typeof owner !== "object" || !("Shared" in owner)) {
      throw new Error(`Object ${objectId} is not shared.`);
    }
    const metadata = {
      initialSharedVersion: owner.Shared.initial_shared_version as string,
    };
    this.sharedMetadataCache.set(objectId, metadata);
    return metadata;
  }

  async buildSharedObjectArg(
    transaction: Transaction,
    objectId: string,
    mutable: boolean,
  ): Promise<TransactionObjectArgument> {
    const metadata = await this.getSharedMetadata(objectId);
    return transaction.sharedObjectRef({
      objectId,
      initialSharedVersion: metadata.initialSharedVersion,
      mutable,
    });
  }

  override async verifyVaas(vaas: Buffer[], tx: Transaction) {
    const wormholePackageId = await this.getWormholePackageId();
    const wormholeState = await this.buildSharedObjectArg(
      tx,
      this.wormholeStateId,
      false,
    );
    type VerifyReturn = Awaited<ReturnType<SuiPythClient["verifyVaas"]>>;
    const verifiedVaas = [] as VerifyReturn;
    for (const vaa of vaas) {
      const [verifiedVaa] = tx.moveCall({
        target: `${wormholePackageId}::vaa::parse_and_verify`,
        arguments: [
          wormholeState,
          tx.pure(
            bcs
              .vector(bcs.U8)
              .serialize([...vaa], { maxSize: MAX_ARGUMENT_SIZE })
              .toBytes(),
          ),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
      verifiedVaas.push(verifiedVaa as VerifyReturn[number]);
    }
    return verifiedVaas;
  }

  public async executePriceFeedUpdates(
    tx: Transaction,
    packageId: string,
    feedIds: HexString[],
    priceUpdatesHotPotato: TransactionObjectArgument,
    coins: TransactionObjectArgument[],
  ): Promise<string[]> {
    const priceInfoObjects: string[] = [];
    let coinId = 0;
    const sharedPythState = await this.buildSharedObjectArg(
      tx,
      this.pythStateId,
      false,
    );
    for (const feedId of feedIds) {
      const priceInfoObjectId = await this.getPriceFeedObjectId(feedId);
      if (!priceInfoObjectId) {
        throw new Error(`Price feed ${feedId} not found, please create it first`);
      }
      priceInfoObjects.push(priceInfoObjectId);
      const sharedPriceInfo = await this.buildSharedObjectArg(tx, priceInfoObjectId, true);
      [priceUpdatesHotPotato] = tx.moveCall({
        target: `${packageId}::pyth::update_single_price_feed`,
        arguments: [
          sharedPythState,
          priceUpdatesHotPotato,
          sharedPriceInfo,
          coins[coinId],
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
      coinId += 1;
    }
    tx.moveCall({
      target: `${packageId}::hot_potato_vector::destroy`,
      arguments: [priceUpdatesHotPotato],
      typeArguments: [`${packageId}::price_info::PriceInfo`],
    });
    return priceInfoObjects;
  }
}
```

**Key observation**: In `executePriceFeedUpdates`, line 187 calls `buildSharedObjectArg(tx, priceInfoObjectId, true)` - marking the PriceInfoObject as **mutable**.

### Donation Transaction Builder (donations.ts)

```typescript
export async function buildFirstTimeDonationTx(
  params: BaseDonationBuilderParams,
): Promise<DonationBuildResult> {
  const {
    suiClient,
    accountAddress,
    campaignId,
    statsId,
    token,
    rawAmount,
    network = DEFAULT_NETWORK,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    maxAgeMsOverride = null,
  } = params;

  validateCommonInputs({
    accountAddress,
    campaignId,
    statsId,
    profileId: null,
    token,
    rawAmount,
  });

  const config = getContractConfig(network);
  const tx = new Transaction();

  const donationCoin = await prepareDonationCoin({
    tx,
    suiClient,
    ownerAddress: accountAddress,
    coinType: token.coinType,
    rawAmount,
  });

  const priceQuote = await attachPriceOracleQuote({
    network,
    token,
    suiClient,
    transaction: tx,
    rawAmount,
  });

  const expectedMinUsdMicro = deriveExpectedMinUsdMicro(
    priceQuote.quotedUsdMicro,
    slippageBps,
  );

  const maxAgeArg = resolveMaxAgeOption(tx, maxAgeMsOverride);

  tx.moveCall({
    target: `${config.contracts.packageId}::donations::donate_and_award_first_time`,
    typeArguments: [token.coinType],
    arguments: [
      tx.object(campaignId),
      tx.object(statsId),
      tx.object(config.contracts.tokenRegistryObjectId),
      tx.object(config.contracts.badgeConfigObjectId),
      tx.object(config.contracts.profilesRegistryObjectId),
      tx.object(CLOCK_OBJECT_ID),
      donationCoin,
      priceQuote.priceInfoObject,
      tx.pure.u64(expectedMinUsdMicro),
      maxAgeArg,
    ],
  });

  return {
    transaction: tx,
    quotedUsdMicro: priceQuote.quotedUsdMicro,
    expectedMinUsdMicro,
    rawAmount,
    pricePublishTimeMs: priceQuote.publishTimeMs,
    priceFeedId: priceQuote.feedId,
    registryMaxAgeMs: priceQuote.registryMaxAgeMs,
    token,
  };
}
```

## Transaction Structure

Here is the actual serialized transaction that fails:

### Transaction Inputs

```json
"inputs": [
  {
    "UnresolvedObject": {
      "objectId": "0x77368dcb9a967aba868d93444a137a4e8a3e2baa9d2bd8e7f6716b75d8fc4ab7"
    }
  },
  {
    "UnresolvedObject": {
      "objectId": "0x23f8d34e534add5ae3ec3ab84e1eb7d1e3b84f28166177d997859c6629d3f94f"
    }
  },
  {
    "Pure": {
      "bytes": "AMqaOwAAAAA="
    }
  },
  {
    "Object": {
      "SharedObject": {
        "objectId": "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790",
        "initialSharedVersion": 1451,
        "mutable": false
      }
    }
  },
  {
    "Pure": {
      "bytes": "oAEBAAAAAAEAvcpf3+BarC8poQkF29M+9oVp+VmQrGqmxnvz7bNdUthgoVccAdXbHa5o0duSgi9jECZafsoVgGsHXbF6mZQzZgFpEda8AAAAAAAa4QH67axYUeMrmyO1+UEajCusSq4+1N17gR3Rpy6kqnEAAAAACoJw3QFBVVdWAAAAAAAPF81zAAAnEP66f4SAhAth+bNIsUs9KhmoGV9m"
    }
  },
  {
    "UnresolvedObject": {
      "objectId": "0x0000000000000000000000000000000000000000000000000000000000000006"
    }
  },
  {
    "Object": {
      "SharedObject": {
        "objectId": "0xd3e79c2c083b934e78b3bd58a490ec6b092561954da6e7322e1e2b3c8abfddc0",
        "initialSharedVersion": 6508275,
        "mutable": false
      }
    }
  },
  {
    "Pure": {
      "bytes": "hwRQTkFVAQAAAACgAQAAAAABAL3KX9/gWqwvKaEJBdvTPvaFaflZkKxqpsZ78+2zXVLYYKFXHAHV2x2uaNHbkoIvYxAmWn7KFYBrB12xepmUM2YBaRHWvAAAAAAAGuEB+u2sWFHjK5sjtflBGowrrEquPtTde4Ed0acupKpxAAAAAAqCcN0BQVVXVgAAAAAADxfNcwAAJxD+un+EgIQLYfmzSLFLPSoZqBlfZgEAVQBQxns/0iXbiRKkJN1LrtYP/d5iXtL+qvKDck+WCP6iZgAAAAANDCjkAAAAAAABzdz////4AAAAAGkR1rwAAAAAaRHWvAAAAAANEzPdAAAAAAABj8UNl7Y/AW3pnEa514xiQoPW9an26keH5bnL7xYFMWm+TNPbp+Pqzuzo8nbLJHEThbVMtuwDmrLMjI6V++Cds1z1U3hD9Y/Osb13RRVjPOAZhGky3FC2g/LeDtYm1buS1Wwv8/2Sag1rj85EJlucrodwidx+a2heOJ3v6AcOS7Is5kQurZNgocPJn4lOoqCfS2w7Y73mQ6NzSCMgTeLDX2L0FtGFfR49EY+DYhRzHOkRtgi22ZwjslSikUwfrNnfIzn5DLkqzCLl0BoAo+VfBJYahVb5YIcn2ik+5igvxIksOGJRhNr11tysOINap4Zu8clGAt2TasyV7p5+Xc9ZKFxCXq5+lBk="
    }
  },
  {
    "Pure": {
      "bytes": "AQAAAAAAAAA="
    }
  },
  {
    "Object": {
      "SharedObject": {
        "objectId": "0x8051460f92772b823f54543e96d79b24d0cb9c1814f4c91dda5c3773769d6eea",
        "initialSharedVersion": 6510326,
        "mutable": true
      }
    }
  },
  {
    "Pure": {
      "bytes": "AA=="
    }
  },
  {
    "UnresolvedObject": {
      "objectId": "0x9e1a648ba30630aa85f3f38dc29c49a01621b0cd9c8d8b084068814e85669ebd"
    }
  },
  {
    "UnresolvedObject": {
      "objectId": "0x4af5ca88565984f3aa8d898540999f95993200bee67a8d037caccbddb4ca4a0b"
    }
  },
  {
    "UnresolvedObject": {
      "objectId": "0xee1330d94cd954ae58fd18a8336738562f05487fae56dda9c655f461eac52b6f"
    }
  },
  {
    "UnresolvedObject": {
      "objectId": "0x71c1e75eb42a29a81680f9f1e454e87468561a5cd28e2217e841c6693d00ea23"
    }
  },
  {
    "UnresolvedObject": {
      "objectId": "0xd72f3907908b0575afea266c457c0109690ab11e8568106364c76e2444c2aeac"
    }
  },
  {
    "Pure": {
      "bytes": "TBEhAAAAAAA="
    }
  }
]
```

**Key observation**: Input 9 (the PriceInfoObject at `0x8051460f92772b823f54543e96d79b24d0cb9c1814f4c91dda5c3773769d6eea`) has `"mutable": true`.

### Transaction Commands

```json
"commands": [
  {
    "MergeCoins": {
      "destination": {
        "Input": 0
      },
      "sources": [
        {
          "Input": 1
        }
      ]
    }
  },
  {
    "SplitCoins": {
      "coin": {
        "Input": 0
      },
      "amounts": [
        {
          "Input": 2
        }
      ]
    }
  },
  {
    "MoveCall": {
      "package": "0x21473617f3565d704aa67be73ea41243e9e34a42d434c31f8182c67ba01ccf49",
      "module": "vaa",
      "function": "parse_and_verify",
      "typeArguments": [],
      "arguments": [
        {
          "Input": 3
        },
        {
          "Input": 4
        },
        {
          "Input": 5
        }
      ]
    }
  },
  {
    "MoveCall": {
      "package": "0x41295e8e99151ca4d18b8982122f29745a4e9e66c25565c9ba9a136320644810",
      "module": "pyth",
      "function": "create_authenticated_price_infos_using_accumulator",
      "typeArguments": [],
      "arguments": [
        {
          "Input": 6
        },
        {
          "Input": 7
        },
        {
          "NestedResult": [
            2,
            0
          ]
        },
        {
          "Input": 5
        }
      ]
    }
  },
  {
    "SplitCoins": {
      "coin": {
        "GasCoin": true
      },
      "amounts": [
        {
          "Input": 8
        }
      ]
    }
  },
  {
    "MoveCall": {
      "package": "0x41295e8e99151ca4d18b8982122f29745a4e9e66c25565c9ba9a136320644810",
      "module": "pyth",
      "function": "update_single_price_feed",
      "typeArguments": [],
      "arguments": [
        {
          "Input": 6
        },
        {
          "NestedResult": [
            3,
            0
          ]
        },
        {
          "Input": 9
        },
        {
          "NestedResult": [
            4,
            0
          ]
        },
        {
          "Input": 5
        }
      ]
    }
  },
  {
    "MoveCall": {
      "package": "0x41295e8e99151ca4d18b8982122f29745a4e9e66c25565c9ba9a136320644810",
      "module": "hot_potato_vector",
      "function": "destroy",
      "typeArguments": [
        "0x41295e8e99151ca4d18b8982122f29745a4e9e66c25565c9ba9a136320644810::price_info::PriceInfo"
      ],
      "arguments": [
        {
          "NestedResult": [
            5,
            0
          ]
        }
      ]
    }
  },
  {
    "MoveCall": {
      "package": "0xc762a509c02849b7ca0b63eb4226c1fb87aed519af51258424a3591faaacac10",
      "module": "donations",
      "function": "donate_and_award_first_time",
      "typeArguments": [
        "0x2::sui::SUI"
      ],
      "arguments": [
        {
          "Input": 11
        },
        {
          "Input": 12
        },
        {
          "Input": 13
        },
        {
          "Input": 14
        },
        {
          "Input": 15
        },
        {
          "Input": 5
        },
        {
          "NestedResult": [
            1,
            0
          ]
        },
        {
          "Input": 9
        },
        {
          "Input": 16
        },
        {
          "Input": 10
        }
      ]
    }
  }
]
```

### Command Breakdown

- **Command 0**: Merge coins
- **Command 1**: Split coins for donation amount
- **Command 2**: Wormhole VAA parse and verify
- **Command 3**: Pyth create authenticated price infos
- **Command 4**: Split coins for Pyth update fee
- **Command 5**: Pyth update_single_price_feed (uses Input 9 - the PriceInfoObject)
- **Command 6**: Destroy hot potato vector
- **Command 7**: Call donate_and_award_first_time (FAILS HERE - uses Input 9 as argument 7)

### Error Details

The error occurs in **Command 7** at **argument index 7**:

```
CommandArgumentError { arg_idx: 7, kind: InvalidArgumentToPrivateEntryFunction } in command 7
```

Command 7's argument 7 is `{"Input": 9}`, which is the PriceInfoObject.

## Package Information

- **CrowdWalrus Package**: `0xc762a509c02849b7ca0b63eb4226c1fb87aed519af51258424a3591faaacac10`
- **Pyth Package**: `0x41295e8e99151ca4d18b8982122f29745a4e9e66c25565c9ba9a136320644810`
- **Wormhole Package**: `0x21473617f3565d704aa67be73ea41243e9e34a42d434c31f8182c67ba01ccf49`
- **PriceInfoObject ID**: `0x8051460f92772b823f54543e96d79b24d0cb9c1814f4c91dda5c3773769d6eea`

## Additional Context

### Pyth SDK Version
Currently using `@pythnetwork/pyth-sui-js` version 2.3.0 (previously tried 2.4.0 with same error).

### Pyth Network Documentation Excerpt

According to the Pyth SDK documentation for version 2.4.0:

> Important Note for Integrators: Your Sui Move module should NOT have a hard-coded call to `pyth::update_single_price_feed`. In other words, the Sui Pyth `pyth::update_single_price_feed` entry point should never be called by a contract, instead it should be called directly from client code (e.g. Typescript or Rust). This is because when a Sui contract is upgraded, the new address is different from the original. If your module has a hard-coded call to `pyth::update_single_price_feed` living at a fixed call-site, it may eventually get bricked due to the way Pyth upgrades are implemented. (We only allows users to interact with the most recent package version for security reasons). Therefore, you should build a Sui programmable transaction that first updates the price by calling `pyth::update_single_price_feed` at the latest call-site from the client-side and then call a function in your contract that invokes `pyth::get_price` on the PriceInfoObject to get the recently updated price.

This is the approach being followed - the price feed update happens in the PTB before calling the donation function.

## What We've Tried

1. **Downgrading Pyth SDK**: Changed from version 2.4.0 to 2.3.0 - same error persists
2. **Using transaction.object()**: Attempted to use `transaction.object()` instead of `buildSharedObjectArg()` for the second reference - same error persists
3. **Verifying Wormhole/Pyth state IDs**: Confirmed they match the official Pyth testnet deployment addresses

## Question

What is causing this `InvalidArgumentToPrivateEntryFunction` error at argument index 7 in command 7, and how should it be resolved?
