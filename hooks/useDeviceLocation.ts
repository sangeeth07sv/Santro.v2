"use client";

import { useEffect, useState } from "react";

export interface DeviceLocation {
  lat: number;
  lng: number;
  heading: number | null;
}

/**
 * Reads the CURRENT DEVICE's own GPS position via watchPosition — used to
 * draw the delivery partner's own "you are here" marker on their map.
 *
 * This is intentionally separate from `LiveLocationBroadcaster` (which only
 * WRITES position to Supabase for others to see) and from
 * `useLiveDeliveryLocation` (which READS another party's broadcast position
 * back from Supabase). Reading your own device's GPS directly avoids a
 * pointless local round-trip through the database and the ~6s throttle
 * `LiveLocationBroadcaster` applies to writes.
 */
export function useDeviceLocation(active: boolean): DeviceLocation | null {
  const [location, setLocation] = useState<DeviceLocation | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading ?? null,
        });
      },
      (err) => console.warn("Geolocation error:", err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [active]);

  return location;
}
