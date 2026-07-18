"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MapPin, MapPinOff } from "lucide-react";

/**
 * Renders nothing visible on success — it just appends ?lat=&lng= to the
 * URL so the server component re-fetches with location. On denial/failure
 * it shows a small dismissible banner and lets the page fall back to the
 * unfiltered catalog (handled by the parent page when lat/lng are absent).
 */
export function LocationGate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "locating" | "denied" | "done">("idle");

  useEffect(() => {
    if (searchParams.get("lat") && searchParams.get("lng")) {
      setStatus("done");
      return;
    }
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", String(pos.coords.latitude));
        params.set("lng", String(pos.coords.longitude));
        router.replace(`${pathname}?${params.toString()}`);
        setStatus("done");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "locating") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
        <MapPin className="h-4 w-4 animate-pulse" /> Finding shops near you...
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <MapPinOff className="h-4 w-4" /> Couldn't get your location — showing all products instead. Enable location and refresh to see shops near you.
      </div>
    );
  }

  return null;
}
