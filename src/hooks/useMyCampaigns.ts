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

import { useSuiClient } from '@mysten/dapp-kit';
import { getContractConfig } from '@/config/contracts';
import { getWalrusUrl } from '@/services/walrus';
import { useEffect, useState } from 'react';

export interface CampaignData {
  // Sui blockchain data
  id: string;
  adminId: string;
  name: string;
  shortDescription: string;
  subdomainName: string;
  startDate: number;
  endDate: number;
  createdAt: number;
  validated: boolean;
  isActive: boolean;

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

export function useMyCampaigns(network: 'devnet' | 'testnet' | 'mainnet' = 'testnet') {
  const suiClient = useSuiClient();
  const config = getContractConfig(network);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  // Fetch all campaign objects by querying dynamic fields on CrowdWalrus
  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsPending(true);
      setError(null);

      try {
        console.log('Querying campaign creation events...');

        // Query CampaignCreated events to get all campaign IDs
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${config.contracts.packageId}::crowd_walrus::CampaignCreated`,
          },
          limit: 50,
        });

        console.log('Campaign creation events:', events);

        // Extract campaign IDs from events
        const campaignIds = events.data
          .map((event: any) => event.parsedJson?.campaign_id)
          .filter((id): id is string => !!id);

        console.log('Campaign IDs from events:', campaignIds);

        if (campaignIds.length === 0) {
          console.log('No campaigns found');
          setCampaigns([]);
          setIsPending(false);
          return;
        }

        // Fetch campaign objects
        const campaignObjects = await suiClient.multiGetObjects({
          ids: campaignIds,
          options: {
            showContent: true,
            showType: true,
          },
        });

        console.log('Fetched campaign objects:', campaignObjects);

        // Process campaign data
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

                console.log(`Campaign "${fields.name}" metadata:`, metadataMap);
                console.log(`Walrus Quilt ID:`, walrusQuiltId);

                const campaignData: CampaignData = {
                  id: fields.id?.id || obj.data?.objectId || '',
                  adminId: fields.admin_id,
                  name: fields.name,
                  shortDescription: fields.short_description,
                  subdomainName: fields.subdomain_name,
                  startDate: Number(fields.start_date),
                  endDate: Number(fields.end_date),
                  createdAt: Number(fields.created_at),
                  validated: fields.validated,
                  isActive: fields.isActive,
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
                    ? getWalrusUrl(walrusQuiltId, network, 'description.html')
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
            .sort((a, b) => b.createdAt - a.createdAt);

        setCampaigns(processedCampaigns);
        setIsPending(false);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError(err as Error);
        setIsPending(false);
      }
    };

    fetchCampaigns();
  }, [suiClient, config.contracts.crowdWalrusObjectId, config.contracts.packageId, network, refetchKey]);

  const refetch = () => {
    setRefetchKey((prev) => prev + 1);
  };

  return {
    campaigns,
    isPending,
    error,
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
