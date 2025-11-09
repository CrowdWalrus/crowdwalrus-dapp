export type PolicyPresetName = string;

export interface PolicyPresetDisplayCopy {
  label: string;
  description: string;
}

const KNOWN_PRESETS: Record<
  string,
  PolicyPresetDisplayCopy & { platformBps: number }
> = {
  standard: {
    label: "Non-Profit",
    description: "100% of payments go directly to your cause.",
    platformBps: 0,
  },
  commercial: {
    label: "Commercial",
    description: "A 5% platform fee applies to funds raised.",
    platformBps: 500,
  },
};

export const DEFAULT_POLICY_PRESET: PolicyPresetName = "standard";

export const POLICY_PRESET_ORDER = Object.keys(KNOWN_PRESETS);

const formatCustomLabel = (name: string) => {
  if (!name) {
    return "Custom Policy";
  }
  return name
    .split(/\s|_/)
    .filter(Boolean)
    .map((segment) =>
      segment.length > 0
        ? segment[0].toUpperCase() + segment.slice(1).toLowerCase()
        : segment,
    )
    .join(" ");
};

const formatBpsDescription = (bps?: number) => {
  if (!Number.isFinite(bps)) {
    return "Custom platform policy preset.";
  }
  const percent = (bps as number) / 100;
  return `Custom platform policy preset (${percent}% fee).`;
};

export function getPolicyDisplayCopy(
  name: PolicyPresetName,
  platformBps?: number,
): PolicyPresetDisplayCopy {
  const normalized = name.toLowerCase();
  const known = KNOWN_PRESETS[normalized];
  if (known) {
    return known;
  }
  return {
    label: formatCustomLabel(name),
    description: formatBpsDescription(platformBps),
  };
}

export function inferPolicyPresetFromBps(
  platformBps?: number | null,
): PolicyPresetName {
  const match = Object.entries(KNOWN_PRESETS).find(
    ([, preset]) => preset.platformBps === platformBps,
  );
  if (match) {
    return match[0];
  }
  if (platformBps === undefined || platformBps === null) {
    return "custom";
  }
  return `custom_${platformBps}`;
}

export function buildFallbackPolicyPresets() {
  return Object.entries(KNOWN_PRESETS).map(([name, preset]) => ({
    name,
    label: preset.label,
    description: preset.description,
    platformBps: preset.platformBps,
    platformAddress: "",
  }));
}
