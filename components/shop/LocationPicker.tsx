"use client";

import { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";

interface Resolved {
  lat: number;
  lng: number;
  address: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  confirmLabel?: string;
  onConfirm: (data: Resolved) => void;
  onCancel?: () => void;
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India, used only if geolocation is unavailable

function MapEvents({ onMoveEnd }: { onMoveEnd: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onMoveEnd(c.lat, c.lng);
    },
  });
  return null;
}

/**
 * A fixed pin sits in the center of the screen; the user drags the map underneath it
 * (same interaction pattern as Rapido/Uber pickup-drop pickers). The address card below
 * live-updates via reverse geocoding whenever the map settles.
 */
export function LocationPicker({ initialLat, initialLng, confirmLabel = "Confirm location", onConfirm, onCancel }: Props) {
  const [center, setCenter] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER
  );
  const [address, setAddress] = useState("Move the map to place the pin");
  const [details, setDetails] = useState<Omit<Resolved, "lat" | "lng" | "address">>({});
  const [isLocating, setIsLocating] = useState(!(initialLat && initialLng));
  const [isResolving, setIsResolving] = useState(false);

  const resolveAddress = useCallback(async (lat: number, lng: number) => {
    setIsResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      const a = data.address ?? {};
      setAddress(data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setDetails({
        line1: [a.house_number, a.road].filter(Boolean).join(" ") || a.suburb || undefined,
        city: a.city || a.town || a.village || a.suburb || undefined,
        state: a.state || undefined,
        postalCode: a.postcode || undefined,
      });
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setDetails({});
    } finally {
      setIsResolving(false);
    }
  }, []);

  useEffect(() => {
    if (initialLat && initialLng) {
      resolveAddress(initialLat, initialLng);
      return;
    }
    if (!navigator.geolocation) {
      setIsLocating(false);
      resolveAddress(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(next);
        setIsLocating(false);
        resolveAddress(next.lat, next.lng);
      },
      () => {
        setIsLocating(false);
        resolveAddress(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMoveEnd(lat: number, lng: number) {
    setCenter({ lat, lng });
    resolveAddress(lat, lng);
  }

  function handleRecenter() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(next);
        setIsLocating(false);
        resolveAddress(next.lat, next.lng);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="relative h-72 w-full bg-surface-muted">
        {isLocating ? (
          <div className="flex h-full items-center justify-center text-sm text-ink/50">
            Finding your location…
          </div>
        ) : (
          <MapContainer center={[center.lat, center.lng]} zoom={16} className="h-full w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onMoveEnd={handleMoveEnd} />
          </MapContainer>
        )}

        {/* Fixed center pin — the map moves underneath it */}
        {!isLocating && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-full">
            <div className="h-7 w-7 rounded-full border-4 border-white bg-emerald-600 shadow-lg" />
            <div className="mx-auto h-3 w-0.5 bg-ink/70" />
          </div>
        )}

        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Use my current location"
          className="absolute bottom-3 right-3 z-[1000] rounded-full bg-white p-2.5 text-indigo-700 shadow-card hover:bg-indigo-50"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-white p-4 dark:bg-indigo-900">
        <p className="text-sm font-semibold text-ink dark:text-white">Select your location</p>
        <p className="mt-1 min-h-[2.5rem] text-xs text-ink/60 dark:text-slate-300">
          {isResolving ? "Locating address…" : address}
        </p>

        <div className="mt-3 flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-outline flex-1">
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => onConfirm({ lat: center.lat, lng: center.lng, address, ...details })}
            disabled={isLocating || isResolving}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
  
