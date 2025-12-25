"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TVShow, Season, Episode } from "@/types/media";
import { cn } from "@/lib/utils";

interface SeasonSelectorProps {
    show: TVShow;
}

export function SeasonSelector({ show }: SeasonSelectorProps) {
    const [selectedSeason, setSelectedSeason] = useState<number>(
        show.seasons[0]?.seasonNumber || 1
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const currentSeason = show.seasons.find(
        (s) => s.seasonNumber === selectedSeason
    );

    return (
        <div className="space-y-6">
            {/* Season Dropdown */}
            <div className="flex items-center justify-between">
                <div className="relative">
                    <Button
                        variant="outline"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="gap-2 bg-gray-800/50 border-gray-700 hover:bg-gray-700 min-w-[180px] justify-between"
                    >
                        <span>Season {selectedSeason}</span>
                        <ChevronDown
                            className={cn(
                                "w-4 h-4 transition-transform",
                                isDropdownOpen && "rotate-180"
                            )}
                        />
                    </Button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl z-50">
                            {show.seasons.map((season) => (
                                <button
                                    key={season.seasonNumber}
                                    onClick={() => {
                                        setSelectedSeason(season.seasonNumber);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-4 py-3 text-left hover:bg-gray-800 flex items-center justify-between",
                                        selectedSeason === season.seasonNumber &&
                                        "bg-primary/20 text-primary"
                                    )}
                                >
                                    <span>Season {season.seasonNumber}</span>
                                    <span className="text-sm text-gray-400">
                                        {season.episodeCount} eps
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-gray-400 text-sm">
                    {currentSeason?.episodeCount || 0} Episodes
                </p>
            </div>

            {/* Episodes Grid */}
            <div className="grid gap-4">
                {currentSeason?.episodes.map((episode) => (
                    <EpisodeCard
                        key={episode.id}
                        episode={episode}
                        showTitle={show.title}
                    />
                ))}

                {(!currentSeason || currentSeason.episodes.length === 0) && (
                    <div className="text-center py-12 text-gray-400">
                        <p>No episodes found in this season</p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface EpisodeCardProps {
    episode: Episode;
    showTitle: string;
}

function EpisodeCard({ episode, showTitle }: EpisodeCardProps) {
    return (
        <Link
            href={`/watch/${episode.folderId}/${episode.id}`}
            className="group flex gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
        >
            {/* Episode Number */}
            <div className="shrink-0 w-8 flex items-center justify-center text-xl font-medium text-gray-500 group-hover:text-primary">
                {episode.episodeNumber}
            </div>

            {/* Thumbnail */}
            <div className="shrink-0 w-32 md:w-48 aspect-video relative rounded-md overflow-hidden bg-gray-800">
                {episode.thumbnail ? (
                    <Image
                        src={episode.thumbnail}
                        alt={episode.title || `Episode ${episode.episodeNumber}`}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Play className="w-8 h-8 text-gray-600" />
                    </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-black fill-black ml-1" />
                    </div>
                </div>
            </div>

            {/* Episode Info */}
            <div className="flex-1 min-w-0 py-1">
                <h3 className="font-medium text-white truncate group-hover:text-primary transition-colors">
                    {episode.title || `Episode ${episode.episodeNumber}`}
                </h3>
                {episode.overview && (
                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                        {episode.overview}
                    </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                    S{episode.seasonNumber}:E{episode.episodeNumber}
                </p>
            </div>
        </Link>
    );
}
