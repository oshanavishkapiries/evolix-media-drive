"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard, MediaCardSkeleton } from "@/components/media-card";
import { cn } from "@/lib/utils";
import type { Movie, TVShow } from "@/types/media";

interface MediaCarouselProps {
    title: string;
    items: (Movie | TVShow)[];
    type: "movie" | "tvshow";
    loading?: boolean;
}

export function MediaCarousel({ title, items, type, loading }: MediaCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const scroll = (direction: "left" | "right") => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = container.clientWidth * 0.8;
        const newPosition =
            direction === "left"
                ? container.scrollLeft - scrollAmount
                : container.scrollLeft + scrollAmount;

        container.scrollTo({
            left: newPosition,
            behavior: "smooth",
        });
    };

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        setShowLeftArrow(container.scrollLeft > 0);
        setShowRightArrow(
            container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );
    };

    return (
        <section className="relative py-4 group/carousel">
            {/* Title */}
            <h2 className="text-lg md:text-xl font-semibold text-white mb-3 px-4 md:px-12">
                {title}
            </h2>

            {/* Carousel Container */}
            <div className="relative">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll("left")}
                    className={cn(
                        "absolute left-0 top-0 bottom-0 z-10 w-12 md:w-16",
                        "flex items-center justify-center",
                        "bg-gradient-to-r from-black/80 to-transparent",
                        "opacity-0 group-hover/carousel:opacity-100 transition-opacity",
                        !showLeftArrow && "hidden"
                    )}
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-8 h-8 text-white" />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className={cn(
                        "absolute right-0 top-0 bottom-0 z-10 w-12 md:w-16",
                        "flex items-center justify-center",
                        "bg-gradient-to-l from-black/80 to-transparent",
                        "opacity-0 group-hover/carousel:opacity-100 transition-opacity",
                        !showRightArrow && "hidden"
                    )}
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-8 h-8 text-white" />
                </button>

                {/* Scrollable Content */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4"
                >
                    {loading ? (
                        // Skeleton loading state
                        Array.from({ length: 8 }).map((_, i) => (
                            <MediaCardSkeleton
                                key={i}
                                className="flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px]"
                            />
                        ))
                    ) : (
                        items.map((item) => (
                            <MediaCard
                                key={item.id}
                                media={item}
                                type={type}
                                className="flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px]"
                            />
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
