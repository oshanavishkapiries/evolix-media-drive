import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomNetflixPlayer } from "@/components/custom-player";
import { Button } from "@/components/ui/button";
import { decrypt } from "@/lib/encryption";
import { getFileMetadata } from "@/lib/gdrive";
import { parseMediaFilename } from "@/lib/parser";

interface WatchPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WatchPageProps) {
    const { id: encryptedId } = await params;

    const isConfigured = Boolean(
        process.env.GD_SERVICE_B64 && process.env.ENCRYPTION_KEY
    );

    if (isConfigured) {
        try {
            const fileId = decrypt(encryptedId);
            if (fileId) {
                const metadata = await getFileMetadata(fileId);
                if (metadata) {
                    const parsed = parseMediaFilename(metadata.name);
                    if (parsed) {
                        return {
                            title: `Playing: ${parsed.title}`,
                        };
                    }
                }
            }
        } catch {
            // Continue with default
        }
    }

    return {
        title: "Now Playing",
    };
}

export default async function WatchPage({ params }: WatchPageProps) {
    const { id: encryptedId } = await params;

    // Check if configured
    const isConfigured = Boolean(
        process.env.GD_SERVICE_B64 && process.env.ENCRYPTION_KEY
    );

    let title = "Video";
    let streamUrl = `/api/stream/${encryptedId}`;
    let poster: string | undefined;

    if (isConfigured) {
        try {
            const fileId = decrypt(encryptedId);
            if (!fileId) {
                notFound();
            }

            const metadata = await getFileMetadata(fileId);
            if (metadata) {
                const parsed = parseMediaFilename(metadata.name);
                if (parsed) {
                    title = parsed.title;
                    if (parsed.year) {
                        title += ` (${parsed.year})`;
                    }
                } else {
                    title = metadata.name.replace(/\.[^/.]+$/, ""); // Remove extension
                }
            }
        } catch {
            // Continue with default title
        }
    } else {
        // Demo mode - show placeholder
        title = "Demo Video";
        streamUrl =
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    }

    // TODO: In the future, we'll fetch subtitle tracks here
    // const subtitles = await getSubtitleTracks(encryptedId);

    return (
        <div className="min-h-screen bg-black">
            {/* Back Button */}
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

            {/* Video Player */}
            <div className="w-full h-screen">
                <CustomNetflixPlayer
                    src={streamUrl}
                    poster={poster}
                    title={title}
                    description="You're Watching"
                    autoPlay={true}
                    subtitles={[
                        // Subtitles will be populated dynamically once subtitle scanning is implemented
                    ]}
                />
            </div>
        </div>
    );
}

