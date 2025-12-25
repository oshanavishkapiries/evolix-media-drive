import { MediaCard } from "@/components/media-card";
import type { MediaLibrary, Movie } from "@/types/media";

async function getMovies(): Promise<Movie[]> {
    const isConfigured = Boolean(
        process.env.GD_SERVICE_B64 &&
        process.env.GD_ROOT_FOLDER
    );

    if (!isConfigured) {
        // Demo movies
        return [
            { id: "1", folderId: "demo-1", title: "Inception", year: 2010, path: "", file: { id: "1", name: "", path: "", mimeType: "", modifiedTime: "" } },
            { id: "2", folderId: "demo-2", title: "The Dark Knight", year: 2008, path: "", file: { id: "2", name: "", path: "", mimeType: "", modifiedTime: "" } },
            { id: "3", folderId: "demo-3", title: "Interstellar", year: 2014, path: "", file: { id: "3", name: "", path: "", mimeType: "", modifiedTime: "" } },
            { id: "4", folderId: "demo-4", title: "The Matrix", year: 1999, path: "", file: { id: "4", name: "", path: "", mimeType: "", modifiedTime: "" } },
            { id: "5", folderId: "demo-5", title: "Pulp Fiction", year: 1994, path: "", file: { id: "5", name: "", path: "", mimeType: "", modifiedTime: "" } },
            { id: "6", folderId: "demo-6", title: "Fight Club", year: 1999, path: "", file: { id: "6", name: "", path: "", mimeType: "", modifiedTime: "" } },
        ];
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/scan`, { cache: "no-store" });
        const library: MediaLibrary = await response.json();
        return library.movies;
    } catch {
        return [];
    }
}

export const metadata = {
    title: "Movies",
};

export default async function MoviesPage() {
    const movies = await getMovies();

    return (
        <div className="pt-24 pb-16 px-4 md:px-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Movies</h1>

            {movies.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 text-lg">No movies found</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Add movies to your /Movies folder in Google Drive
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {movies.map((movie) => (
                        <MediaCard key={movie.id} media={movie} type="movie" />
                    ))}
                </div>
            )}
        </div>
    );
}
