"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface LiveDeliveryLocation {
  lat: number;
  lng: number;
  heading: number | null;
  updatedAt: string;
}

/**
 * Subscribes to the live position of the delivery partner working `orderId`.
 * Reads the current row once on mount, then stays in sync via Supabase
 * Realtime as the partner's device pushes new coordinates. Returns null
 * until a position has been seen (e.g. before pickup, or if the partner's
 * device hasn't reported in yet).
 */
export function useLiveDeliveryLocation(orderId: string | null): LiveDeliveryLocation | null {
  const [location, setLocation] = useState<LiveDeliveryLocation | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("delivery_locations")
      .select("latitude, longitude, heading, updated_at")
      .eq("order_id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setLocation({ lat: data.latitude, lng: data.longitude, heading: data.heading, updatedAt: data.updated_at });
      });

    const channel = supabase
      .channel(`delivery-location-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_locations", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const row = payload.new as any;
          if (!row) return;
          setLocation({ lat: row.latitude, lng: row.longitude, heading: row.heading, updatedAt: row.updated_at });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return location;
      }
        
