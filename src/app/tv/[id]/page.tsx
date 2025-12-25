import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, ArrowLeft, Star, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TVShow } from "@/types/media";
import { SeasonSelector } from "./season-selector";

interface TVShowPageProps {
    params: Promise<{ id: string }>;
}

async function getTVShow(encryptedId: string): Promise<TVShow | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/tv/${encryptedId}`, {
            cache: "no-store",
        });

        if (!response.ok) {
            return null;
        }

        return response.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: TVShowPageProps) {
    const { id } = await params;
    const show = await getTVShow(id);

    return {
        title: show ? `${show.title} (${show.year})` : "TV Show Details",
        description: show?.overview,
    };
}

export default async function TVShowPage({ params }: TVShowPageProps) {
    const { id } = await params;
    const show = await getTVShow(id);

    if (!show) {
        notFound();
    }

    // Get first episode for the play button
    const firstEpisode = show.seasons[0]?.episodes[0];

    return (
        <div className="min-h-screen">
            {/* Hero Backdrop */}
            <div className="relative w-full min-h-[70vh]">
                {/* Background Image */}
                <div className="absolute inset-0">
                    {show.backdrop ? (
                        <Image
                            src={show.backdrop}
                            alt={show.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : show.poster ? (
                        <Image
                            src={show.poster}
                            alt={show.title}
                            fill
                            className="object-cover blur-xl opacity-50"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-gray-900" />
                    )}
                </div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-20 left-4 md:left-12 z-10">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10"
                    >
                        <Link href="/tv">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                </div>

                {/* Content */}
                <div className="relative flex items-end min-h-[70vh] pb-8 pt-32 px-4 md:px-16">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10 max-w-6xl w-full">
                        {/* Poster */}
                        {show.poster && (
                            <div className="shrink-0 w-32 md:w-48 lg:w-56 aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl">
                                <Image
                                    src={show.poster}
                                    alt={show.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex flex-col gap-4 flex-1">
                            {/* Title */}
                            <h1 className="text-3xl md:text-5xl font-bold text-white">
                                {show.title}
                            </h1>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                {show.year && <span>{show.year}</span>}
                                {show.rating && (
                                    <span className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-primary fill-primary" />
                                        {show.rating.toFixed(1)}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Tv className="w-4 h-4" />
                                    {show.seasons.length} Season{show.seasons.length !== 1 ? "s" : ""}
                                </span>
                                <span>{show.totalEpisodes} Episodes</span>
                            </div>

                            {/* Overview */}
                            {show.overview && (
                                <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-4 max-w-3xl">
                                    {show.overview}
                                </p>
                            )}

                            {/* Play Button */}
                            {firstEpisode && (
                                <div className="flex gap-3 mt-2">
                                    <Button asChild size="lg" className="gap-2">
                                        <Link href={`/watch/${firstEpisode.folderId}/${firstEpisode.id}`}>
                                            <Play className="w-5 h-5 fill-current" />
                                            Play S1:E1
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Season & Episode Selector */}
            <div className="px-4 md:px-16 py-8 bg-background">
                <SeasonSelector show={show} />
            </div>
        </div>
    );
}
