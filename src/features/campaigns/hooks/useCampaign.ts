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
import {
  parseOptionalTimestampFromMove,
  parseTimestampFromMove,
  parseU64FromMove,
} from '@/shared/utils/onchainParsing';

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

      const campaignData: CampaignData = {
        id: fields.id?.id || campaignObject.data.objectId || '',
        adminId: fields.admin_id,
        name: fields.name,
        shortDescription: fields.short_description,
        subdomainName: fields.subdomain_name,
        recipientAddress: fields.recipient_address ?? metadataMap['recipient_address'] ?? '',
        startDateMs: parseTimestampFromMove(fields.start_date),
        endDateMs: parseTimestampFromMove(fields.end_date),
        createdAtMs: parseTimestampFromMove(fields.created_at_ms ?? fields.created_at),
        isVerified: fields.is_verified !== undefined ? Boolean(fields.is_verified) : Boolean(fields.validated),
        isActive: Boolean(fields.is_active ?? fields.isActive),
        isDeleted: Boolean(fields.is_deleted ?? fields.isDeleted),
        deletedAtMs: parseOptionalTimestampFromMove(fields.deleted_at_ms),
        nextUpdateSeq: parseU64FromMove(fields.next_update_seq ?? fields.nextUpdateSeq ?? 0),
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
