/** Formats an address row (or the shipping_address jsonb snapshot on an order) into a single display line. */
export function addressToQuery(addr: any) {
  if (!addr) return "";
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(", ");
}

/** Short version for tight UI (pills, cards) — just the first line and city. */
export function addressToShortLabel(addr: any) {
  if (!addr) return "";
  return [addr.line1, addr.city].filter(Boolean).join(", ");
}
