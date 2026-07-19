"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const MIN_UPDATE_INTERVAL_MS = 6000; // throttle writes; watchPosition can fire much faster than this

/**
 * Mount on the delivery partner's active-order screen. While `active` is
 * true, watches the device's GPS and upserts the latest position into
 * `delivery_locations`, throttled so we're not hammering the DB on every
 * GPS tick. Renders nothing — it's a background data feed for the map.
 */
export function LiveLocationBroadcaster({ orderId, active }: { orderId: string; active: boolean }) {
  const lastWriteRef = useRef(0);

  useEffect(() => {
    if (!active || !navigator.geolocation) return;

    const supabase = createClient();
    let watchId: number | null = null;
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - lastWriteRef.current < MIN_UPDATE_INTERVAL_MS) return;
          lastWriteRef.current = now;

          supabase
            .from("delivery_locations")
            .upsert(
              {
                order_id: orderId,
                delivery_partner_id: user.id,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                heading: position.coords.heading ?? null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "order_id" }
            )
            .then(({ error }) => {
              // Silent failure is intentional: a missed GPS ping shouldn't
              // interrupt the delivery flow. The next watchPosition tick retries.
              if (error) console.warn("Location update failed:", error.message);
            });
        },
        (err) => console.warn("Geolocation error:", err.message),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    })();

    return () => {
      cancelled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [orderId, active]);

  return null;
}
