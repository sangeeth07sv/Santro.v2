"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { estimateDelivery, haversineKm } from "@/utils/geo";

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#1f7a5c;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const dropIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;background:#dc2626;border:3px solid white;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

function riderIcon(heading: number | null) {
  const rotation = heading ?? 0;
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#181228;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;transform:rotate(${rotation}deg)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/>
        <path d="M12 17V6l-3 3M6 17l3-6h6l3 6"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ points, recenterSignal }: { points: [number, number][]; recenterSignal?: number }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(points, { padding: [48, 48] });
    // recenterSignal is intentionally in the deps array with no other use —
    // bumping it (e.g. from a "recenter" button) re-runs this effect even
    // when the points themselves haven't changed.
  }, [map, points, recenterSignal]);
  return null;
}

interface Point {
  lat: number;
  lng: number;
  label: string;
}

export function OrderRouteMap({
  pickup,
  drop,
  live,
  recenterSignal,
}: {
  pickup: Point | null;
  drop: Point | null;
  live?: { lat: number; lng: number; heading: number | null } | null;
  recenterSignal?: number;
}) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!pickup || !drop) return;
    let cancelled = false;
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(coords)) {
          setRouteCoords(coords.map(([lng, lat]: [number, number]) => [lat, lng]));
        }
      })
      .catch(() => {
        // Fall back to a straight line between the two points if routing fails.
        setRouteCoords([[pickup.lat, pickup.lng], [drop.lat, drop.lng]]);
      });
    return () => {
      cancelled = true;
    };
  }, [pickup?.lat, pickup?.lng, drop?.lat, drop?.lng]);

  if (!drop) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink/40">
        No location on file for this order.
      </div>
    );
  }

  const center: [number, number] = live
    ? [live.lat, live.lng]
    : pickup
    ? [(pickup.lat + drop.lat) / 2, (pickup.lng + drop.lng) / 2]
    : [drop.lat, drop.lng];
  const fitPoints: [number, number][] = [
    ...(pickup ? [[pickup.lat, pickup.lng] as [number, number]] : []),
    [drop.lat, drop.lng],
    ...(live ? [[live.lat, live.lng] as [number, number]] : []),
  ];
  const distanceKm = live ? haversineKm(live, drop) : pickup ? haversineKm(pickup, drop) : null;
  const eta = distanceKm != null ? estimateDelivery(distanceKm) : null;

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
        <Marker position={[drop.lat, drop.lng]} icon={dropIcon} />
        {live && <Marker position={[live.lat, live.lng]} icon={riderIcon(live.heading)} />}
        {routeCoords && <Polyline positions={routeCoords} pathOptions={{ color: "#181228", weight: 4 }} />}
        {fitPoints.length >= 2 && <FitBounds points={fitPoints} recenterSignal={recenterSignal} />}
      </MapContainer>

      {eta && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center justify-between rounded-full bg-white px-4 py-2 text-xs font-medium text-ink shadow-card dark:bg-indigo-800 dark:text-white">
          <span>{eta.distanceKm} km away</span>
          <span>~{eta.etaMinutes} min</span>
        </div>
      )}
    </div>
  );
        }
