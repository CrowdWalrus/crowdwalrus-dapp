/**
 * Hook to fetch a single campaign by ID from the blockchain
 *
 * This hook:
 * 1. Fetches a specific campaign object from Sui blockchain by ID
 * 2. Extracts Walrus blob ID from campaign metadata
 * 3. Generates Walrus URLs for cover image and description
 * 4. Returns structured campaign data
 */

import { useSuiClientQuery } from '@mysten/dapp-kit';
import { DEFAULT_NETWORK } from '@/shared/config/networkConfig';
import { getWalrusUrl } from '@/services/walrus';
import { useMemo } from 'react';
import type { CampaignData } from './useMyCampaigns';

export function useCampaign(
  campaignId: string,
  network: 'devnet' | 'testnet' | 'mainnet' = DEFAULT_NETWORK
) {
  // Fetch single campaign object
  const {
    data: campaignObject,
    isPending,
    error,
    refetch,
  } = useSuiClientQuery(
    'getObject',
    {
      id: campaignId,
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!campaignId,
    }
  );

  // Process campaign data
  const campaign = useMemo(() => {
    if (!campaignObject?.data) return null;

    try {
      const content = campaignObject.data.content;
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

      console.log(`Campaign "${fields.name}" metadata:`, metadataMap);
      console.log(`Walrus Quilt ID:`, walrusQuiltId);

      const parseTimestamp = (value: unknown): number => {
        if (typeof value === 'string' || typeof value === 'number') {
          const parsed = Number(value);
          if (!Number.isFinite(parsed)) {
            return 0;
          }
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

      const campaignData: CampaignData = {
        id: fields.id?.id || campaignObject.data.objectId || '',
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
  }, [campaignObject, network]);

  return {
    campaign,
    isPending,
    error: error || null,
    refetch,
  };
}
