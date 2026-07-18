"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/types/database";

const FALLBACK_SLIDES = [
  {
    id: "fallback-1",
    title: "Everything, sorted.",
    subtitle: "Local shops, one cart, delivered fast across India.",
    link_url: "/products",
  },
  {
    id: "fallback-2",
    title: "This week's offers",
    subtitle: "Fresh deals from shops near you, updated daily.",
    link_url: "/products?sort=newest",
  },
  {
    id: "fallback-3",
    title: "Sell on SANTRO",
    subtitle: "List your shop and reach customers in your city.",
    link_url: "/register?role=shop_owner",
  },
];

export function HeroBannerCarousel({ banners }: { banners: Banner[] }) {
  const slides = banners.length > 0 ? banners : null;
  const [index, setIndex] = useState(0);
  const count = slides ? slides.length : FALLBACK_SLIDES.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, count]);

  return (
    <div className="relative w-full overflow-hidden bg-indigo-800">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides
          ? slides.map((banner) => (
              <Link
                key={banner.id}
                href={banner.link_url || "/products"}
                className="relative aspect-[16/7] w-full shrink-0 sm:aspect-[21/6]"
              >
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </Link>
            ))
          : FALLBACK_SLIDES.map((banner) => (
              <Link
                key={banner.id}
                href={banner.link_url}
                className="relative flex aspect-[16/7] w-full shrink-0 items-center bg-gradient-to-br from-indigo-800 via-indigo-700 to-indigo-600 sm:aspect-[21/6]"
              >
                <div className="px-6 sm:px-12">
                  <h2 className="font-display text-2xl font-bold text-white sm:text-4xl">{banner.title}</h2>
                  <p className="mt-2 max-w-md text-sm text-indigo-100 sm:text-base">{banner.subtitle}</p>
                  <span className="mt-4 inline-block rounded-md bg-marigold-500 px-4 py-2 text-xs font-semibold text-indigo-900 sm:text-sm">
                    Shop now
                  </span>
                </div>
              </Link>
            ))}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-indigo-900 shadow-card hover:bg-white sm:left-4 sm:p-2"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-indigo-900 shadow-card hover:bg-white sm:right-4 sm:p-2"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-marigold-500" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
    }
          
