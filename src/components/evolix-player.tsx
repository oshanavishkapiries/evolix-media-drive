"use client";

import Image from "next/image";
import { Play, Film, Subtitles, Link2, Info } from "lucide-react";

export interface SubtitleTrack {
    src: string;
    srclang: string;
    label: string;
    default?: boolean;
}

export interface EvolixPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    description?: string;
    subtitles?: SubtitleTrack[];
    year?: number;
    duration?: string;
    quality?: string;
}

/**
 * Evolix Player - Placeholder component for video playback
 * This component displays video metadata and links.
 * Replace with actual video player implementation later.
 */
export function EvolixPlayer({
    src,
    poster,
    title = "Unknown Title",
    description,
    subtitles = [],
    year,
    duration,
    quality,
}: EvolixPlayerProps) {
    return (
        <div className="evolix-player w-full h-full min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 md:p-12">
            {/* Header with Logo */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Film className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl font-bold text-primary">Evolix Player</h1>
                </div>
                <span className="text-gray-500 text-sm">Development Mode</span>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Poster Section */}
                {poster ? (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-8 shadow-2xl border border-gray-800">
                        <Image
                            src={poster}
                            alt={title}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="w-20 h-20 rounded-full bg-primary/80 flex items-center justify-center">
                                <Play className="w-10 h-10 text-black fill-black ml-1" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-8 bg-gray-800 border border-gray-700 flex items-center justify-center">
                        <div className="text-center">
                            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">No poster available</p>
                        </div>
                    </div>
                )}

                {/* Video Info Section */}
                <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-800 space-y-6">
                    {/* Title */}
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
                        {description && (
                            <p className="text-gray-400">{description}</p>
                        )}
                        <div className="flex gap-4 mt-3 text-sm text-gray-500">
                            {year && <span>{year}</span>}
                            {duration && <span>{duration}</span>}
                            {quality && <span className="px-2 py-0.5 bg-primary/20 text-primary rounded">{quality}</span>}
                        </div>
                    </div>

                    {/* Divider */}
                    <hr className="border-gray-800" />

                    {/* Video Stream URL */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Link2 className="w-5 h-5" />
                            <h3 className="font-semibold">Video Stream URL</h3>
                        </div>
                        <div className="bg-black/50 rounded-lg p-4 font-mono text-sm break-all">
                            <code className="text-green-400">{src}</code>
                        </div>
                        <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            Open in new tab →
                        </a>
                    </div>

                    {/* Subtitles Section */}
                    {subtitles.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                                <Subtitles className="w-5 h-5" />
                                <h3 className="font-semibold">Subtitle Tracks ({subtitles.length})</h3>
                            </div>
                            <div className="bg-black/50 rounded-lg p-4 space-y-3">
                                {subtitles.map((subtitle, index) => (
                                    <div key={index} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-medium">
                                                {subtitle.label}
                                                {subtitle.default && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">Default</span>
                                                )}
                                            </span>
                                            <span className="text-gray-500 text-sm">{subtitle.srclang}</span>
                                        </div>
                                        <code className="text-green-400 text-sm break-all">{subtitle.src}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Subtitles */}
                    {subtitles.length === 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Subtitles className="w-5 h-5" />
                                <h3 className="font-semibold">Subtitle Tracks</h3>
                            </div>
                            <p className="text-gray-500 text-sm">No subtitles available</p>
                        </div>
                    )}

                    {/* Additional Info */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Info className="w-5 h-5" />
                            <h3 className="font-semibold">Developer Notes</h3>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-200 text-sm">
                            <p className="font-medium mb-2">⚠️ Placeholder Component</p>
                            <p>
                                This is a placeholder component. The actual video player will be implemented manually.
                                All video metadata is displayed above for development purposes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Styles */}
            <style jsx global>{`
                .evolix-player {
                    font-family: "Rubik", -apple-system, BlinkMacSystemFont, sans-serif;
                }
            `}</style>
        </div>
    );
}
