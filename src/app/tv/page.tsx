import { MediaCard } from "@/components/media-card";
import type { MediaLibrary, TVShow } from "@/types/media";

async function getTVShows(): Promise<TVShow[]> {
    const isConfigured = Boolean(
        process.env.GD_SERVICE_B64 &&
        process.env.GD_ROOT_FOLDER
    );

    if (!isConfigured) {
        // Demo TV shows
        return [
            { id: "1", title: "Breaking Bad", year: 2008, path: "", seasons: [], totalEpisodes: 62 },
            { id: "2", title: "Game of Thrones", year: 2011, path: "", seasons: [], totalEpisodes: 73 },
            { id: "3", title: "The Office (US)", year: 2005, path: "", seasons: [], totalEpisodes: 201 },
            { id: "4", title: "Stranger Things", year: 2016, path: "", seasons: [], totalEpisodes: 34 },
            { id: "5", title: "The Mandalorian", year: 2019, path: "", seasons: [], totalEpisodes: 24 },
            { id: "6", title: "Friends", year: 1994, path: "", seasons: [], totalEpisodes: 236 },
        ];
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/scan`, { cache: "no-store" });
        const library: MediaLibrary = await response.json();
        return library.tvShows;
    } catch {
        return [];
    }
}

export const metadata = {
    title: "TV Shows",
};

export default async function TVShowsPage() {
    const tvShows = await getTVShows();

    return (
        <div className="pt-24 pb-16 px-4 md:px-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">TV Shows</h1>

            {tvShows.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 text-lg">No TV shows found</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Add TV shows to your /TV Shows folder in Google Drive
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {tvShows.map((show) => (
                        <MediaCard key={show.id} media={show} type="tvshow" />
                    ))}
                </div>
            )}
        </div>
    );
}
