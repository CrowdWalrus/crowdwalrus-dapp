import type { SuiClient } from "@mysten/sui/client";
import type { PolicyPresetName } from "@/features/campaigns/constants/policies";

export interface OnChainPolicyPreset {
  name: PolicyPresetName;
  platformBps: number;
  platformAddress: string;
  enabled: boolean;
}

interface MoveFieldValue {
  fields?: Record<string, unknown>;
  [key: string]: unknown;
}

const isMoveObject = (value: unknown): value is { dataType: string; fields?: Record<string, unknown> } =>
  Boolean(
    value &&
      typeof value === "object" &&
      "dataType" in (value as Record<string, unknown>) &&
      (value as Record<string, unknown>).dataType === "moveObject",
  );

/**
 * Fetch enabled policy presets from the on-chain PolicyRegistry.
 */
export async function fetchPolicyPresetsFromRegistry(
  client: SuiClient,
  registryId: string,
): Promise<OnChainPolicyPreset[]> {
  const registry = await client.getObject({
    id: registryId,
    options: {
      showContent: true,
    },
  });

  const registryContent = registry.data?.content;
  if (!isMoveObject(registryContent)) {
    throw new Error("Policy registry object is missing Move content.");
  }

  const policiesTableId =
    (registryContent.fields?.policies as MoveFieldValue | undefined)?.fields?.id &&
    ((registryContent.fields?.policies as MoveFieldValue).fields?.id as MoveFieldValue)?.id;

  if (typeof policiesTableId !== "string") {
    throw new Error("Policy registry table ID is missing.");
  }

  const entries = await fetchAllDynamicFields(client, policiesTableId);

  const policyObjects = await Promise.all(
    entries.map((entry) =>
      client.getDynamicFieldObject({
        parentId: policiesTableId,
        name: entry.name,
      }),
    ),
  );

  return policyObjects
    .map((object) => {
      const content = object.data?.content;
      if (!isMoveObject(content)) {
        return null;
      }
      const valueFields = (content.fields?.value as MoveFieldValue | undefined)?.fields;
      if (!valueFields) {
        return null;
      }

      const name = content.fields?.name;
      const formattedName = typeof name === "string" ? name : null;
      if (!formattedName) {
        return null;
      }

      const platformBps = Number(valueFields.platform_bps ?? 0);
      const platformAddress =
        typeof valueFields.platform_address === "string"
          ? valueFields.platform_address
          : "";
      const enabled = Boolean(valueFields.enabled);

      return {
        name: formattedName,
        platformBps,
        platformAddress,
        enabled,
      };
    })
    .filter(
      (preset): preset is OnChainPolicyPreset =>
        Boolean(preset && preset.enabled),
    );
}

async function fetchAllDynamicFields(client: SuiClient, parentId: string) {
  const collected: Awaited<
    ReturnType<typeof client.getDynamicFields>
  >["data"] = [];

  let cursor: string | null = null;
  do {
    const response = await client.getDynamicFields({
      parentId,
      cursor: cursor ?? undefined,
      limit: 50,
    });
    collected.push(...response.data);
    cursor = response.hasNextPage ? response.nextCursor ?? null : null;
  } while (cursor);

  return collected;
}
