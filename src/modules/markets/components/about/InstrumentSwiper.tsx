"use client";

import Link from "next/link";
import { A11y, Autoplay, FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useMediaQuery } from "@/platform/hooks/useMediaQuery";

export interface SwiperInstrument {
  href: string;
  symbol: string;
  name: string;
  market: string;
  status: string;
  available: boolean;
}

/**
 * Instrument cards under the hero, in a Swiper carousel: long autoplay delay,
 * slow eased transitions, loop, drag/swipe, pauses on hover. Under reduced
 * motion autoplay is off and the row is simply swipeable.
 */
export function InstrumentSwiper({ items, label }: { items: SwiperInstrument[]; label: string }) {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  return (
    <section aria-label={label} className="mk-swiper mt-16">
      <Swiper
        key={reduced ? "still" : "auto"}
        modules={[Autoplay, A11y, FreeMode]}
        loop
        grabCursor
        slidesPerView="auto"
        spaceBetween={16}
        centeredSlides
        speed={1600}
        autoplay={reduced ? false : { delay: 3600, disableOnInteraction: false, pauseOnMouseEnter: true }}
        a11y={{ enabled: true }}
        className="px-4! sm:px-6!"
      >
        {items.map((item) => (
          <SwiperSlide key={item.href} className="w-[230px]! sm:w-[260px]!">
            <Link href={item.href} className="pf-tile mk-spot group flex h-full flex-col rounded-[22px]! p-5 transition-colors hover:bg-(--surface-2)">
              <span className="flex items-center justify-between gap-3">
                <span className="font-mono text-[18px] font-semibold tracking-wide text-(--text-primary)">{item.symbol}</span>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-(--text-secondary)">
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${item.available ? "bg-(--positive)" : "border border-(--accent)"}`} />
                  {item.status}
                </span>
              </span>
              <span className="mt-2 text-[14px] text-(--text-secondary)">{item.name}</span>
              <span className="mt-4 text-[12px] font-medium tracking-wide text-(--accent) uppercase">{item.market}</span>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
