import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EvolixPlayer, type SubtitleTrack } from "@/components/evolix-player";
import { Button } from "@/components/ui/button";

interface WatchPageProps {
    params: Promise<{ folderId: string; id: string }>;
}

async function getVideoInfo(fileId: string, folderId: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
        const response = await fetch(
            `${baseUrl}/api/video/${fileId}?folderId=${folderId}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            return null;
        }

        return response.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: WatchPageProps) {
    const { folderId, id: fileId } = await params;

    const videoInfo = await getVideoInfo(fileId, folderId);
    if (videoInfo) {
        return {
            title: `Playing: ${videoInfo.title}`,
        };
    }

    return {
        title: "Now Playing",
    };
}

export default async function WatchPage({ params }: WatchPageProps) {
    const { folderId, id: fileId } = await params;

    const isConfigured = Boolean(process.env.GD_SERVICE_B64);

    let title = "Video";
    let year: number | undefined;
    let streamUrl = `/api/stream/${fileId}`;
    let poster: string | undefined;
    let description: string | undefined;
    let subtitles: SubtitleTrack[] = [];

    if (isConfigured) {
        const videoInfo = await getVideoInfo(fileId, folderId);

        if (!videoInfo) {
            notFound();
        }

        title = videoInfo.title;
        year = videoInfo.year;
        streamUrl = videoInfo.streamUrl;

        if (videoInfo.seasonNumber !== undefined) {
            description = `Season ${videoInfo.seasonNumber} Episode ${videoInfo.episodeNumber || 1}`;
            if (videoInfo.episodeTitle) {
                description += ` - ${videoInfo.episodeTitle}`;
            }
        }

        // Convert subtitles to player format
        subtitles = (videoInfo.subtitles || []).map(
            (sub: { id: string; label: string; language: string }, index: number) => ({
                src: `/api/subtitle/${sub.id}`,
                srclang: sub.language,
                label: sub.label,
                default: index === 0,
            })
        );
    } else {
        // Demo mode
        title = "Demo Video";
        year = 2024;
        description = "Demo Mode - Configure Google Drive to stream real content";
        streamUrl =
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    }

    return (
        <div className="min-h-screen bg-black">
            <div className="absolute top-4 left-4 z-50">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                >
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>
            </div>

            <EvolixPlayer
                src={streamUrl}
                poster={poster}
                title={title}
                description={description}
                year={year}
                subtitles={subtitles}
            />
        </div>
    );
}
