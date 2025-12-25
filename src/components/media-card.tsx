"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Movie, TVShow } from "@/types/media";

interface MediaCardProps {
    media: Movie | TVShow;
    type: "movie" | "tvshow";
    className?: string;
}

export function MediaCard({ media, type, className }: MediaCardProps) {
    const href = type === "movie"
        ? `/movies/${media.encryptedId}`
        : `/tv/${media.encryptedId}`;

    return (
        <Link
            href={href}
            className={cn(
                "media-card relative block rounded-md overflow-hidden bg-card aspect-[2/3] group",
                className
            )}
        >
            {/* Thumbnail - prefer TMDB poster over Google Drive thumbnail */}
            {(media.poster || media.thumbnail) ? (
                <Image
                    src={media.poster || media.thumbnail || ""}
                    alt={media.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <span className="text-4xl">🎬</span>
                </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-black fill-black translate-x-0.5" />
                </div>
            </div>

            {/* Title overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                <h3 className="text-sm font-medium text-white line-clamp-2">
                    {media.title}
                </h3>
                {media.year && (
                    <p className="text-xs text-gray-400 mt-0.5">{media.year}</p>
                )}
            </div>
        </Link>
    );
}

// Skeleton version
export function MediaCardSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "relative rounded-md overflow-hidden aspect-[2/3]",
                className
            )}
        >
            <div className="skeleton absolute inset-0" />
        </div>
    );
}
