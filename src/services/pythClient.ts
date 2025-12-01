import type { SuiClient } from "@mysten/sui/client";
import type { Transaction, TransactionObjectArgument } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { bcs } from "@mysten/sui/bcs";
import { SuiPythClient } from "@pythnetwork/pyth-sui-js";

type HexString = string;

const MAX_ARGUMENT_SIZE = 16 * 1024;

interface SharedObjectMetadata {
  initialSharedVersion: string;
}

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

  override async verifyVaasAndGetHotPotato(
    tx: Transaction,
    updates: Buffer[],
    packageId: string,
  ) {
    if (updates.length > 1) {
      throw new Error(
        "SDK does not support sending multiple accumulator messages in a single transaction",
      );
    }
    const vaa = this.extractVaaBytesFromAccumulatorMessage(updates[0]!);
    const verifiedVaas = await this.verifyVaas([vaa], tx);
    const sharedPythState = await this.buildSharedObjectArg(
      tx,
      this.pythStateId,
      false,
    );
    const [priceUpdatesHotPotato] = tx.moveCall({
      target: `${packageId}::pyth::create_authenticated_price_infos_using_accumulator`,
      arguments: [
        sharedPythState,
        tx.pure(
          bcs
            .vector(bcs.U8)
            .serialize([...updates[0]!], { maxSize: MAX_ARGUMENT_SIZE })
            .toBytes(),
        ),
        verifiedVaas[0]!,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    return priceUpdatesHotPotato;
  }

  private async getObjectPackageId(objectId: string): Promise<string> {
    const cached = this.packageIdCache.get(objectId);
    if (cached) {
      return cached;
    }
    const { data } = await this.provider.getObject({
      id: objectId,
      options: { showContent: true },
    });

    const fields = (data?.content as { fields?: Record<string, unknown> } | undefined)?.fields;
    const upgradeCapPackage = (() => {
      const upgradeCap = fields && (fields.upgrade_cap as { fields?: { package?: string } } | undefined);
      return upgradeCap?.fields?.package;
    })();

    const packageId =
      upgradeCapPackage ??
      (() => {
        const type = (data?.content as { type?: string } | undefined)?.type;
        if (!type || typeof type !== "string") {
          return null;
        }
        return type.split("::")[0] ?? null;
      })();

    if (!packageId) {
      throw new Error(`Unable to determine package ID for object ${objectId}.`);
    }
    this.packageIdCache.set(objectId, packageId);
    return packageId;
  }

  override async getPythPackageId(): Promise<string> {
    if (!this.resolvedPythPackageId) {
      this.resolvedPythPackageId = await this.getObjectPackageId(this.pythStateId);
    }
    return this.resolvedPythPackageId;
  }

  override async getWormholePackageId(): Promise<string> {
    if (!this.cachedWormholePackageId) {
      this.cachedWormholePackageId = await this.getObjectPackageId(this.wormholeStateId);
    }
    return this.cachedWormholePackageId;
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
