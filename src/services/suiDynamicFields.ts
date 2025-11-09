import type { SuiClient } from "@mysten/sui/client";

export type DynamicFieldEntry = Awaited<
  ReturnType<SuiClient["getDynamicFields"]>
>["data"][number];

/**
 * Fetch all dynamic field entries underneath a parent object by following
 * pagination cursors until exhaustion. Sui only returns up to `limit`
 * entries per call, so this helper consolidates the pages for consumers.
 */
export async function fetchAllDynamicFields(
  client: SuiClient,
  parentId: string,
) {
  const entries: DynamicFieldEntry[] = [];
  let cursor: string | null = null;

  do {
    // Sui RPC requires undefined (not null) when cursor is absent.
    const response = await client.getDynamicFields({
      parentId,
      cursor: cursor ?? undefined,
      limit: 50,
    });

    entries.push(...response.data);
    cursor = response.hasNextPage ? response.nextCursor ?? null : null;
  } while (cursor);

  return entries;
}
