// CrowdWalrus sunset date (local calendar day). The site switches from the
// "sunsetting" to the "has sunset" copy from this day onward.
export const SUNSET_DATE = new Date(2026, 9, 27);

export const SUNSET_DATE_LABEL = "October 27, 2026";

export const CONTACT_EMAIL = "hello@crowdwalrus.xyz";

export function hasSunset(now: Date = new Date()): boolean {
  return now.getTime() >= SUNSET_DATE.getTime();
}
