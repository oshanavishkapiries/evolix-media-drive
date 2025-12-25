import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, ArrowLeft, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/types/media";

interface MoviePageProps {
    params: Promise<{ id: string }>;
}

async function getMovie(encryptedId: string): Promise<Movie | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/movie/${encryptedId}`, {
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

export async function generateMetadata({ params }: MoviePageProps) {
    const { id } = await params;
    const movie = await getMovie(id);

    return {
        title: movie ? `${movie.title} (${movie.year})` : "Movie Details",
        description: movie?.overview,
    };
}

export default async function MoviePage({ params }: MoviePageProps) {
    const { id } = await params;
    const movie = await getMovie(id);

    if (!movie) {
        notFound();
    }

    return (
        <div className="min-h-screen">
            {/* Hero Backdrop */}
            <div className="relative w-full min-h-screen">
                {/* Background Image */}
                <div className="absolute inset-0">
                    {movie.backdrop ? (
                        <Image
                            src={movie.backdrop}
                            alt={movie.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : movie.poster ? (
                        <Image
                            src={movie.poster}
                            alt={movie.title}
                            fill
                            className="object-cover blur-xl opacity-50"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-gray-900" />
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
                        <Link href="/movies">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                </div>

                {/* Content */}
                <div className="relative flex items-end min-h-screen pb-16 pt-32 px-4 md:px-16">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10 max-w-6xl w-full">
                        {/* Poster - visible on all screens */}
                        {movie.poster && (
                            <div className="shrink-0 w-32 md:w-56 lg:w-64 aspect-2/3 relative rounded-lg overflow-hidden shadow-2xl">
                                <Image
                                    src={movie.poster}
                                    alt={movie.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 space-y-4">
                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                                {movie.title}
                            </h1>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-300">
                                {movie.year && (
                                    <span className="bg-white/10 px-3 py-1 rounded-full">
                                        {movie.year}
                                    </span>
                                )}
                                {movie.rating && (
                                    <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                                        <Star className="w-4 h-4 fill-yellow-400" />
                                        {movie.rating.toFixed(1)}
                                    </span>
                                )}
                                {movie.runtime && (
                                    <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                                        <Clock className="w-4 h-4" />
                                        {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                                    </span>
                                )}
                            </div>

                            {/* Overview */}
                            {movie.overview && (
                                <p className="text-sm md:text-base lg:text-lg text-gray-200 max-w-2xl leading-relaxed line-clamp-4 md:line-clamp-none">
                                    {movie.overview}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-2">
                                <Button
                                    asChild
                                    variant="netflix"
                                    size="lg"
                                    className="gap-2 text-base md:text-lg px-6 md:px-8"
                                >
                                    <Link href={`/watch/${movie.folderId || 'unknown'}/${movie.id}`}>
                                        <Play className="w-5 h-5 md:w-6 md:h-6 fill-black" />
                                        Play
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info Section */}
            <div className="px-8 md:px-16 py-12 space-y-8">
                {/* File Info */}
                <div className="bg-card/50 rounded-xl p-6 max-w-2xl">
                    <h2 className="text-lg font-semibold text-white mb-4">File Information</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-400">Filename</dt>
                            <dd className="text-gray-200">{movie.file.name}</dd>
                        </div>
                        {movie.file.size && (
                            <div className="flex justify-between">
                                <dt className="text-gray-400">Size</dt>
                                <dd className="text-gray-200">
                                    {(movie.file.size / (1024 * 1024 * 1024)).toFixed(2)} GB
                                </dd>
                            </div>
                        )}
                        {movie.tmdbId && (
                            <div className="flex justify-between">
                                <dt className="text-gray-400">TMDB ID</dt>
                                <dd className="text-gray-200">
                                    <a
                                        href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {movie.tmdbId}
                                    </a>
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>
        </div>
    );
}
