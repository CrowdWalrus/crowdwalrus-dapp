/**
 * Success State Component
 *
 * Shown when: WizardStep.SUCCESS
 *
 * Purpose:
 * - Celebrate successful campaign creation
 * - Show campaign details and links
 * - Provide next actions (view campaign, share, etc.)
 *
 * UI Elements to implement:
 * - Success icon/animation
 * - Congratulations message
 * - Campaign URL/link
 * - Transaction details link (explorer)
 * - "View Campaign" button
 * - "Close" button
 * - Optional: Share buttons (Twitter, copy link, etc.)
 *
 * Design considerations:
 * - Make it celebratory and positive
 * - Clear next steps
 * - Easy access to campaign URL
 * - Transaction hash for verification
 */

import type { CreateCampaignResult } from '@/features/campaigns/types/campaign'

export interface SuccessStateProps {
  /** Campaign creation result data */
  campaignResult?: CreateCampaignResult | null

  /** Called when user clicks "Close" */
  onClose?: () => void
}

export const SuccessState = ({
  campaignResult,
  onClose,
}: SuccessStateProps) => {
  // TODO: Implement your UI here

  // Helper to generate campaign URL (adjust based on your routing)
  const getCampaignUrl = () => {
    if (!campaignResult) return ''
    // TODO: Update this URL pattern based on your routing
    return `/campaign/${campaignResult.campaignId}`
  }

  // Helper to generate explorer URL (adjust based on network)
  const getExplorerUrl = () => {
    if (!campaignResult) return ''
    // TODO: Update this based on your network (testnet/mainnet)
    return `https://suiscan.xyz/testnet/tx/${campaignResult.transactionDigest}`
  }

  return (
    <div className="space-y-6 py-4">
      {/* TODO: Success icon/animation */}
      <div className="flex justify-center">
        <div className="text-6xl">🎉</div>
        {/* Replace with proper success icon/animation */}
      </div>

      {/* TODO: Success message */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Campaign Created!</h2>
        <p className="text-sm text-muted-foreground">
          Your campaign has been successfully published on the blockchain
        </p>
      </div>

      {/* TODO: Campaign details */}
      {campaignResult && (
        <div className="space-y-3">
          {/* Campaign ID */}
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">Campaign ID</p>
            <p className="text-sm font-mono break-all">{campaignResult.campaignId}</p>
          </div>

          {/* Transaction Hash */}
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">Transaction</p>
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-primary hover:underline break-all"
            >
              {campaignResult.transactionDigest}
            </a>
          </div>

          {/* TODO: Add more details */}
          {/* - Walrus blob ID */}
          {/* - Subdomain */}
          {/* - Links to view assets */}
        </div>
      )}

      {/* TODO: Action buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            // TODO: Navigate to campaign page
            window.location.href = getCampaignUrl()
          }}
          className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          View Campaign
        </button>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-md border"
        >
          Close
        </button>
      </div>

      {/* TODO: Optional share options */}
      {/* - Copy link button */}
      {/* - Share on Twitter */}
      {/* - Share on Discord */}
    </div>
  )
}
