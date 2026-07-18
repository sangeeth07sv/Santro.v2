"use client";

import dynamic from "next/dynamic";

export const NearbyShopsMapLoader = dynamic(
  () => import("./NearbyShopsMap").then((m) => m.NearbyShopsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-surface-muted text-sm text-ink/40 dark:bg-indigo-800">
        Loading map…
      </div>
    ),
  }
);
