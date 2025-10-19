/**
 * Allowed campaign sub-name pattern: lowercase letters, numbers, interior hyphens only.
 * Hyphen cannot be the first or last character to satisfy SuiNS constraints.
 */
export const SUBDOMAIN_PATTERN = /^(?!-)[a-z0-9-]+(?<!-)$/;

/**
 * Ensure campaign subdomains always include the configured domain suffix.
 * Trims user input and avoids double-appending when a `.sui` suffix already exists.
 */
export function formatSubdomain(subdomain: string, domain: string): string {
  const normalized = subdomain.trim();

  if (!normalized) {
    return normalized;
  }

  if (normalized.endsWith(`.${domain}`)) {
    return normalized;
  }

  return `${normalized}.${domain}`;
}

/**
 * Remove the configured domain suffix from a subdomain, if present.
 * Returns the original value when inputs are empty or the suffix is missing.
 */
export function extractSubdomainLabel(
  subdomain: string,
  domain: string,
): string {
  const normalizedSubdomain = subdomain.trim();
  if (!normalizedSubdomain) {
    return "";
  }

  const normalizedDomain = domain.trim();
  if (!normalizedDomain) {
    return normalizedSubdomain;
  }

  const suffix = `.${normalizedDomain}`;
  const lowerSubdomain = normalizedSubdomain.toLowerCase();
  const lowerSuffix = suffix.toLowerCase();

  if (lowerSubdomain.endsWith(lowerSuffix)) {
    return normalizedSubdomain.slice(0, normalizedSubdomain.length - suffix.length);
  }

  return normalizedSubdomain;
}

/**
 * Build a URL-safe slug for campaign routes by removing the domain suffix
 * and converting the remaining label to lowercase.
 */
export function toCampaignSlug(subdomain: string, domain: string): string {
  const label = extractSubdomainLabel(subdomain, domain).trim();
  if (!label) {
    return "";
  }
  return label.toLowerCase();
}
