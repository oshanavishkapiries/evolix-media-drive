"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

interface PlayerData {
    title: string;
    description: string;
    poster?: string;
    sources: Array<{ file: string; label: string; default?: boolean }>;
    captions: Array<{ file: string; label: string; kind: string; default?: boolean }>;
}

/**
 * Evolix Player - Redirects to JWPlayer with Netflix skin
 * Encodes video data as base64 and passes via URL parameter
 */
export function EvolixPlayer({
    src,
    poster,
    title = "Unknown Title",
    description,
    subtitles = [],
}: EvolixPlayerProps) {
    const [status, setStatus] = useState("Connecting to server...");

    useEffect(() => {
        // Build player data object
        const playerData: PlayerData = {
            title: title,
            description: description || "You're Watching",
            poster: poster,
            sources: [
                { file: src, label: "Auto", default: true }
            ],
            captions: subtitles.map((sub, index) => ({
                file: sub.src,
                label: sub.label,
                kind: "captions",
                default: sub.default || index === 0
            }))
        };

        // Encode data as base64
        const jsonString = JSON.stringify(playerData);
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

        // Update status
        setStatus("Preparing player...");

        // Short delay to show the loading UI, then redirect
        const timer = setTimeout(() => {
            setStatus("Launching player...");

            // Redirect to the static player page with encoded data
            // Using replace() to avoid back-button loop (replaces history instead of adding)
            const playerUrl = `/player-core/index.html?data=${encodeURIComponent(base64Data)}`;
            window.location.replace(playerUrl);
        }, 1500);

        return () => clearTimeout(timer);
    }, [src, poster, title, description, subtitles]);

    return (
        <div className="evolix-player w-full h-full min-h-screen bg-black flex flex-col items-center justify-center">
            {/* Netflix-style loading animation */}
            <div className="flex flex-col items-center gap-6">
                {/* Animated loader */}
                <div className="relative">
                    <Loader2 className="w-16 h-16 text-[#FFD700] animate-spin" />
                </div>

                {/* Status text */}
                <div className="text-center space-y-2">
                    <p className="text-white text-lg font-medium">{status}</p>
                    <p className="text-gray-500 text-sm">Please wait...</p>
                </div>

                {/* Movie title preview */}
                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm uppercase tracking-wide">Now Playing</p>
                    <h1 className="text-white text-2xl md:text-3xl font-bold mt-2">{title}</h1>
                    {description && (
                        <p className="text-gray-400 text-sm mt-1">{description}</p>
                    )}
                </div>
            </div>

            {/* Background gradient animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 via-black to-black animate-pulse" style={{ animationDuration: '3s' }} />

            {/* Styles */}
            <style jsx global>{`
                .evolix-player {
                    font-family: "Rubik", -apple-system, BlinkMacSystemFont, sans-serif;
                    position: relative;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
