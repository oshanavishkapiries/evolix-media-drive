"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Movie, TVShow } from "@/types/media";

interface HeroBannerProps {
    media: Movie | TVShow;
    type: "movie" | "tvshow";
}

export function HeroBanner({ media, type }: HeroBannerProps) {
    const watchUrl = type === "movie"
        ? `/watch/${media.encryptedId}`
        : `/tv/${media.encryptedId}`;

    const detailUrl = type === "movie"
        ? `/movies/${media.encryptedId}`
        : `/tv/${media.encryptedId}`;

    return (
        <div className="relative w-full h-[80vh] min-h-[500px] max-h-[800px]">
            {/* Background Image */}
            <div className="absolute inset-0">
                {media.backdrop ? (
                    <Image
                        src={media.backdrop}
                        alt={media.title}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
                )}
            </div>

            {/* Gradient Overlays */}
            <div className="hero-gradient absolute inset-0" />
            <div className="hero-left-gradient absolute inset-0" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 pb-20 md:pb-32">
                <div className="max-w-2xl space-y-4">
                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
                        {media.title}
                    </h1>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                        {media.year && <span>{media.year}</span>}
                        {media.rating && (
                            <span className="flex items-center gap-1">
                                <span className="text-green-500">★</span>
                                {media.rating.toFixed(1)}
                            </span>
                        )}
                        {"runtime" in media && media.runtime && (
                            <span>{Math.floor(media.runtime / 60)}h {media.runtime % 60}m</span>
                        )}
                        {"totalEpisodes" in media && (
                            <span>{media.seasons.length} Seasons</span>
                        )}
                    </div>

                    {/* Overview */}
                    {media.overview && (
                        <p className="text-base md:text-lg text-gray-200 line-clamp-3 max-w-xl">
                            {media.overview}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4">
                        <Button
                            asChild
                            variant="netflix"
                            size="lg"
                            className="gap-2"
                        >
                            <Link href={watchUrl}>
                                <Play className="w-5 h-5 fill-black" />
                                Play
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="secondary"
                            size="lg"
                            className="gap-2 bg-gray-500/70 hover:bg-gray-500/50"
                        >
                            <Link href={detailUrl}>
                                <Info className="w-5 h-5" />
                                More Info
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Skeleton version for loading state
export function HeroBannerSkeleton() {
    return (
        <div className="relative w-full h-[80vh] min-h-[500px] max-h-[800px] bg-gray-900">
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 pb-20 md:pb-32">
                <div className="max-w-2xl space-y-4">
                    <div className="skeleton h-12 w-80" />
                    <div className="skeleton h-4 w-48" />
                    <div className="skeleton h-20 w-full max-w-xl" />
                    <div className="flex gap-3 pt-4">
                        <div className="skeleton h-12 w-32" />
                        <div className="skeleton h-12 w-40" />
                    </div>
                </div>
            </div>
        </div>
    );
}
