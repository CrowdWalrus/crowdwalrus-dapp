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
