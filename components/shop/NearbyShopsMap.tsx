"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface NearbyProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  rating_avg?: number;
  distance_km?: number;
  owner?: { shop_name?: string | null; latitude?: number | null; longitude?: number | null } | null;
}

function pinIcon(rating: number | undefined, highlighted: boolean) {
  const label = rating && rating > 0 ? rating.toFixed(1) : "•";
  return L.divIcon({
    className: "",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${highlighted ? 40 : 32}px;height:${highlighted ? 40 : 32}px;
      border-radius:9999px 9999px 9999px 2px;transform:rotate(-45deg);
      background:${highlighted ? "#cf8a26" : "#e8a33d"};
      box-shadow:0 2px 6px rgba(24,18,40,0.35);border:2px solid white;">
      <span style="transform:rotate(45deg);color:#181228;font:700 ${highlighted ? 12 : 11}px sans-serif;">${label}</span>
    </div>`,
    iconSize: [highlighted ? 40 : 32, highlighted ? 40 : 32],
    iconAnchor: [highlighted ? 20 : 16, highlighted ? 40 : 32],
  });
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom(), { animate: true });
  return null;
}

export function NearbyShopsMap({
  userLat,
  userLng,
  products,
  activeId,
}: {
  userLat: number;
  userLng: number;
  products: NearbyProduct[];
  activeId?: string | null;
}) {
  // Group by shop location so we don't stack duplicate pins per product from the same shop.
  const shopPins = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; shopName: string; products: NearbyProduct[] }>();
    for (const p of products) {
      if (p.owner?.latitude == null || p.owner?.longitude == null) continue;
      const key = `${p.owner.latitude},${p.owner.longitude}`;
      if (!map.has(key)) {
        map.set(key, { lat: p.owner.latitude, lng: p.owner.longitude, shopName: p.owner.shop_name ?? "Local shop", products: [] });
      }
      map.get(key)!.products.push(p);
    }
    return Array.from(map.values());
  }, [products]);

  const center: [number, number] = [userLat, userLng];

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full" style={{ background: "#f4eedf" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />

      <Marker
        position={center}
        icon={L.divIcon({
          className: "",
          html: `<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })}
      >
        <Popup>You are here</Popup>
      </Marker>

      {shopPins.map((shop, i) => {
        const best = shop.products.reduce((a, b) => ((b.rating_avg ?? 0) > (a.rating_avg ?? 0) ? b : a), shop.products[0]);
        const isActive = shop.products.some((p) => p.id === activeId);
        const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`;
        return (
          <Marker key={i} position={[shop.lat, shop.lng]} icon={pinIcon(best.rating_avg, isActive)}>
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-ink">{shop.shopName}</p>
                <p className="text-xs text-ink/50">{shop.products.length} item{shop.products.length === 1 ? "" : "s"} nearby</p>
                <div className="mt-2 flex gap-2">
                  <Link href={`/products/${best.slug}`} className="text-xs font-medium text-marigold-700 underline">
                    View items
                  </Link>
                  <a href={gmapsUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-700 underline">
                    Directions
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
