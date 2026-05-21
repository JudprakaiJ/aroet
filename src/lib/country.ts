/**
 * Map customers.country (free text, UPPERCASE in DB) → ISO-2 + flag emoji.
 *
 * Returns null when the country is unknown so callers can decide whether to
 * render a placeholder. The mapping covers everything currently in the DB
 * plus the obvious neighbours.
 */

const COUNTRY_TO_ISO: Record<string, string> = {
  // Currently in DB
  THAILAND: "TH",
  CHINA: "CN",
  INDIA: "IN",
  PHILIPPINES: "PH",
  JAPAN: "JP",
  MALAYSIA: "MY",
  "HONG KONG": "HK",
  AUSTRALIA: "AU",
  TAIWAN: "TW",
  INDONESIA: "ID",
  SINGAPORE: "SG",
  VIETNAM: "VN",
  "SOUTH KOREA": "KR",
  USA: "US",
  BELGIUM: "BE",
  // Likely additions later
  "UNITED STATES": "US",
  "UNITED KINGDOM": "GB",
  UK: "GB",
  GERMANY: "DE",
  FRANCE: "FR",
  CANADA: "CA",
  MEXICO: "MX",
  BRAZIL: "BR",
  NETHERLANDS: "NL",
  SPAIN: "ES",
  ITALY: "IT",
  CAMBODIA: "KH",
  LAOS: "LA",
  MYANMAR: "MM",
  BURMA: "MM",
  BANGLADESH: "BD",
  PAKISTAN: "PK",
  "SRI LANKA": "LK",
  "NEW ZEALAND": "NZ",
  "SAUDI ARABIA": "SA",
  UAE: "AE",
  "UNITED ARAB EMIRATES": "AE",
  TURKEY: "TR",
  EGYPT: "EG",
  "SOUTH AFRICA": "ZA",
  RUSSIA: "RU",
  POLAND: "PL",
  SWEDEN: "SE",
  NORWAY: "NO",
  DENMARK: "DK",
  FINLAND: "FI",
  SWITZERLAND: "CH",
  AUSTRIA: "AT",
  IRELAND: "IE",
  PORTUGAL: "PT",
  GREECE: "GR",
};

/** Country name → ISO-2 (uppercase). Trims and uppercases input. */
export function countryIso(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = name.trim().toUpperCase();
  return COUNTRY_TO_ISO[key] ?? null;
}

/** Country name → flag emoji. Returns empty string when unknown. */
export function countryFlag(name: string | null | undefined): string {
  const iso = countryIso(name);
  if (!iso) return "";
  // Each ASCII letter +127397 maps into the regional-indicator Unicode block,
  // and two regional indicators side-by-side render as a flag.
  const base = 0x1f1e6 - "A".charCodeAt(0);
  return iso
    .split("")
    .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
    .join("");
}

/** Display-friendly title-cased country name. */
export function countryLabel(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
