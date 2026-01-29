export const DOCS_BASE_URL = "https://docs.crowdwalrus.xyz";

const buildDocsUrl = (path: string) => `${DOCS_BASE_URL}/${path}`;

export const DOCS_LINKS = {
  startHere: {
    whatIsCrowdWalrus: buildDocsUrl("start-here/what-is-crowdwalrus"),
    howCrowdWalrusWorks: buildDocsUrl("start-here/how-crowdwalrus-works"),
    keyConceptsGlossary: buildDocsUrl("start-here/key-concepts-glossary"),
  },
  gettingStarted: {
    installSuiWallet: buildDocsUrl("getting-started/install-a-sui-wallet"),
    chooseNetwork: buildDocsUrl("getting-started/choose-network"),
    getSuiForGas: buildDocsUrl("getting-started/get-sui-for-gas"),
    getWalForStorage: buildDocsUrl("getting-started/get-wal-for-storage"),
  },
  help: {
    faq: buildDocsUrl("help/faq"),
    troubleshooting: buildDocsUrl("help/troubleshooting"),
  },
  campaignOwners: {
    launchCampaign: buildDocsUrl("campaign-owners/launch-a-campaign"),
    managingCampaign: buildDocsUrl("campaign-owners/managing-your-campaign"),
    campaignWritingToolkit: buildDocsUrl(
      "campaign-owners/campaign-writing-toolkit",
    ),
  },
  donors: {
    howToContribute: buildDocsUrl("donors/how-to-contribute"),
    nftRewards: buildDocsUrl("donors/nft-rewards"),
  },
  trustSafety: {
    verificationOverview: buildDocsUrl("trust-safety/verification-overview"),
    verificationProcess: buildDocsUrl("trust-safety/verification-process"),
    reportingAbuse: buildDocsUrl("trust-safety/reporting-abuse"),
  },
  developers: {
    indexerAndApis: buildDocsUrl("developers/indexer-and-apis"),
  },
  legal: {
    termsOfUse: buildDocsUrl("legal/terms-of-use"),
    privacyPolicy: buildDocsUrl("legal/privacy-policy"),
    disclaimer: buildDocsUrl("legal/disclaimer"),
  },
} as const;
