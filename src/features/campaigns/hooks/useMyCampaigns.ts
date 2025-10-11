/**
 * Hook to fetch all campaigns from the blockchain
 *
 * This hook:
 * 1. Queries the CrowdWalrus object to get all campaign IDs
 * 2. Fetches campaign objects from Sui blockchain
 * 3. Extracts Walrus blob ID from campaign metadata
 * 4. Fetches cover images and descriptions from Walrus storage
 * 5. Returns structured campaign data
 */

import { useSuiClientQuery } from '@mysten/dapp-kit';
import { getContractConfig } from '@/shared/config/contracts';
import { DEFAULT_NETWORK } from '@/shared/config/networkConfig';
import { getWalrusUrl } from '@/services/walrus';
import { useMemo } from 'react';

export interface CampaignData {
  // Sui blockchain data
  id: string;
  adminId: string;
  name: string;
  shortDescription: string;
  subdomainName: string;
  recipientAddress: string;
  startDateMs: number;
  endDateMs: number;
  createdAtMs: number;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAtMs: number | null;
  nextUpdateSeq: number;

  // Metadata fields
  fundingGoal: string;
  category: string;
  walrusQuiltId: string;
  walrusStorageEpochs: string;
  coverImageId: string;
  socialTwitter?: string;
  socialDiscord?: string;
  socialWebsite?: string;

  // Walrus URLs
  coverImageUrl: string;
  descriptionUrl: string;
}

export function useMyCampaigns(network: 'devnet' | 'testnet' | 'mainnet' = DEFAULT_NETWORK) {
  const config = getContractConfig(network);

  // Step 1: Query CampaignCreated events to get all campaign IDs
  const {
    data: eventsData,
    isPending: isEventsPending,
    error: eventsError,
    refetch: refetchEvents,
  } = useSuiClientQuery('queryEvents', {
    query: {
      MoveEventType: `${config.contracts.packageId}::crowd_walrus::CampaignCreated`,
    },
    limit: 50,
    order: 'descending',
  });

  // Extract campaign IDs from events
  const campaignIds = useMemo(() => {
    if (!eventsData?.data) return [];

    const ids = eventsData.data
      .map((event: any) => event.parsedJson?.campaign_id)
      .filter((id): id is string => !!id);

    console.log('Campaign IDs from events:', ids);
    return ids;
  }, [eventsData]);

  // Step 2: Fetch campaign objects (only when we have IDs)
  const {
    data: campaignObjects,
    isPending: isCampaignsPending,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useSuiClientQuery(
    'multiGetObjects',
    {
      ids: campaignIds,
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: campaignIds.length > 0,
    }
  );

  // Step 3: Process campaign data
  const campaigns = useMemo(() => {
    if (!campaignObjects) return [];

    console.log('Fetched campaign objects:', campaignObjects);

    const processedCampaigns = campaignObjects
      .map((obj) => {
        try {
          const content = obj.data?.content;
          if (!content || content.dataType !== 'moveObject') return null;

          const fields = content.fields as any;
          const metadata = fields.metadata?.fields?.contents || [];
          const metadataMap: Record<string, string> = {};

          metadata.forEach((item: any) => {
            const key = item.fields?.key;
            const value = item.fields?.value;
            if (key && value) {
              metadataMap[key] = value;
            }
          });

          const walrusQuiltId = metadataMap['walrus_quilt_id'] || '';

          const parseTimestamp = (value: unknown): number => {
            if (typeof value === 'string' || typeof value === 'number') {
              const parsed = Number(value);
              if (!Number.isFinite(parsed)) {
                return 0;
              }
              // Detect legacy seconds-based timestamps and convert to milliseconds
              if (parsed > 0 && parsed < 1_000_000_000_000) {
                return parsed * 1000;
              }
              return parsed;
            }
            if (typeof value === 'bigint') {
              const parsed = Number(value);
              if (!Number.isFinite(parsed)) {
                return 0;
              }
              if (parsed > 0 && parsed < 1_000_000_000_000) {
                return parsed * 1000;
              }
              return parsed;
            }
            return 0;
          };

          const parseOptionalTimestamp = (optionValue: unknown): number | null => {
            if (!optionValue) {
              return null;
            }
            if (typeof optionValue === 'string' || typeof optionValue === 'number') {
              const parsed = Number(optionValue);
              if (!Number.isFinite(parsed)) {
                return null;
              }
              if (parsed > 0 && parsed < 1_000_000_000_000) {
                return parsed * 1000;
              }
              return parsed;
            }
            if (typeof optionValue === 'object') {
              const valueObj = optionValue as Record<string, unknown>;
              if ('fields' in valueObj && valueObj.fields) {
                const fieldsRecord = valueObj.fields as Record<string, unknown>;
                const candidates = [
                  fieldsRecord.value,
                  fieldsRecord.some,
                  Array.isArray(fieldsRecord.vec) && fieldsRecord.vec.length > 0
                    ? fieldsRecord.vec[0]
                    : undefined,
                ];
                for (const candidate of candidates) {
                  if (candidate !== undefined && candidate !== null) {
                    const parsed = Number(candidate);
                    if (Number.isFinite(parsed)) {
                      if (parsed > 0 && parsed < 1_000_000_000_000) {
                        return parsed * 1000;
                      }
                      return parsed;
                    }
                  }
                }
              }
              if ('Some' in valueObj && valueObj.Some !== undefined && valueObj.Some !== null) {
                const parsed = Number(valueObj.Some);
                if (!Number.isFinite(parsed)) {
                  return null;
                }
                if (parsed > 0 && parsed < 1_000_000_000_000) {
                  return parsed * 1000;
                }
                return parsed;
              }
            }
            return null;
          };

          const parseU64Raw = (value: unknown, fallback = 0): number => {
            if (typeof value === 'string' || typeof value === 'number') {
              const parsed = Number(value);
              return Number.isFinite(parsed) ? parsed : fallback;
            }
            if (typeof value === 'bigint') {
              const parsed = Number(value);
              return Number.isFinite(parsed) ? parsed : fallback;
            }
            return fallback;
          };

          console.log(`Campaign "${fields.name}" metadata:`, metadataMap);
          console.log(`Walrus Quilt ID:`, walrusQuiltId);

          const campaignData: CampaignData = {
            id: fields.id?.id || obj.data?.objectId || '',
            adminId: fields.admin_id,
            name: fields.name,
            shortDescription: fields.short_description,
            subdomainName: fields.subdomain_name,
            recipientAddress: fields.recipient_address ?? metadataMap['recipient_address'] ?? '',
            startDateMs: parseTimestamp(fields.start_date),
            endDateMs: parseTimestamp(fields.end_date),
            createdAtMs: parseTimestamp(fields.created_at_ms ?? fields.created_at),
            isVerified: fields.is_verified !== undefined ? Boolean(fields.is_verified) : Boolean(fields.validated),
            isActive: Boolean(fields.is_active ?? fields.isActive),
            isDeleted: Boolean(fields.is_deleted ?? fields.isDeleted),
            deletedAtMs: parseOptionalTimestamp(fields.deleted_at_ms),
            nextUpdateSeq: parseU64Raw(fields.next_update_seq ?? fields.nextUpdateSeq ?? 0),
            fundingGoal: metadataMap['funding_goal'] || '0',
            category: metadataMap['category'] || 'Other',
            walrusQuiltId,
            walrusStorageEpochs: metadataMap['walrus_storage_epochs'] || '0',
            coverImageId: metadataMap['cover_image_id'] || 'cover.jpg',
            socialTwitter: metadataMap['social_twitter'],
            socialDiscord: metadataMap['social_discord'],
            socialWebsite: metadataMap['social_website'],
            coverImageUrl: walrusQuiltId
              ? getWalrusUrl(walrusQuiltId, network, metadataMap['cover_image_id'] || 'cover.jpg')
              : '',
            descriptionUrl: walrusQuiltId
              ? getWalrusUrl(walrusQuiltId, network, 'description.json')
              : '',
          };

          console.log('Generated URLs:', {
            coverImageUrl: campaignData.coverImageUrl,
            descriptionUrl: campaignData.descriptionUrl,
          });

          return campaignData;
        } catch (err) {
          console.error('Error parsing campaign object:', err);
          return null;
        }
      })
      .filter((campaign): campaign is CampaignData => campaign !== null)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);

    return processedCampaigns;
  }, [campaignObjects, network]);

  // Combine loading and error states
  const isPending = isEventsPending || isCampaignsPending;
  const error = eventsError || campaignsError;

  // Refetch both queries
  const refetch = () => {
    refetchEvents();
    if (campaignIds.length > 0) {
      refetchCampaigns();
    }
  };

  return {
    campaigns,
    isPending,
    error: error || null,
    refetch,
    hasNoCampaigns: !isPending && campaigns.length === 0,
  };
}

/**
 * Hook to fetch campaign description from Walrus
 */
export function useCampaignDescription(descriptionUrl: string) {
  const fetchDescription = async () => {
    if (!descriptionUrl) return '';

    try {
      const response = await fetch(descriptionUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch description: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching campaign description:', error);
      return '';
    }
  };

  return fetchDescription;
}
