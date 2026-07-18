"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MapPin, MapPinOff } from "lucide-react";

/**
 * Same pattern as components/shop/LocationGate.tsx, reused here for the home
 * page: renders nothing on success (appends ?lat=&lng= so the server
 * component re-fetches with location), shows a small banner on denial and
 * lets the page fall back to non-personalized sections.
 */
export function HomeLocationGate() {
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
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
        <MapPin className="h-4 w-4 animate-pulse" /> Finding shops near you...
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <MapPinOff className="h-4 w-4" /> Couldn't get your location — enable it to see shops, offers, and delivery times near you.
      </div>
    );
  }

  return null;
}
