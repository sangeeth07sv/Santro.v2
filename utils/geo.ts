/**
 * Local-delivery distance, fee, and ETA helpers.
 * Shared by the client-side checkout estimate and the server-side order
 * creation so the number the customer sees always matches what they're charged.
 */

const EARTH_RADIUS_KM = 6371;
const FREE_RADIUS_KM = 2; // first 2km delivered free
const PER_KM_RATE = 8; // ₹ per km beyond the free radius
const BASE_FEE = 20; // ₹ base fee once outside the free radius
const AVG_SPEED_KMH = 20; // assumed local delivery speed (bike, city traffic)
const MIN_ETA_MINUTES = 15; // packing + dispatch buffer
const MAX_SHIPPING_FEE = 149; // cap so far-out addresses don't get an absurd fee

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export interface DeliveryEstimate {
  distanceKm: number;
  fee: number;
  etaMinutes: number;
}

/** distanceKm should be the distance to the farthest shop in the cart. */
export function estimateDelivery(distanceKm: number): DeliveryEstimate {
  const billableKm = Math.max(0, distanceKm - FREE_RADIUS_KM);
  const fee = billableKm === 0 ? 0 : Math.min(BASE_FEE + billableKm * PER_KM_RATE, MAX_SHIPPING_FEE);
  const etaMinutes = Math.round(MIN_ETA_MINUTES + (distanceKm / AVG_SPEED_KMH) * 60);

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    fee: Math.round(fee),
    etaMinutes,
  };
}

export const DEFAULT_SHIPPING_FEE = 49; // fallback when we don't have coordinates for either side
