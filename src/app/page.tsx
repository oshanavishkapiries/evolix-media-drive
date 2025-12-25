import { HeroBanner, HeroBannerSkeleton } from "@/components/hero-banner";
import { MediaCarousel } from "@/components/media-carousel";
import type { MediaLibrary } from "@/types/media";

// Demo data for initial display without Google Drive connection
const demoLibrary: MediaLibrary = {
  movies: [
    {
      id: "demo-1",
      folderId: "demo-folder-1",
      title: "Inception",
      year: 2010,
      path: "Inception (2010).mp4",
      file: { id: "demo-1", name: "Inception (2010).mp4", path: "", mimeType: "video/mp4", modifiedTime: "" },
      overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
      rating: 8.8,
      runtime: 148,
    },
    {
      id: "demo-2",
      folderId: "demo-folder-2",
      title: "The Dark Knight",
      year: 2008,
      path: "The Dark Knight (2008).mp4",
      file: { id: "demo-2", name: "The Dark Knight (2008).mp4", path: "", mimeType: "video/mp4", modifiedTime: "" },
      overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
      rating: 9.0,
      runtime: 152,
    },
    {
      id: "demo-3",
      folderId: "demo-folder-3",
      title: "Interstellar",
      year: 2014,
      path: "Interstellar (2014).mp4",
      file: { id: "demo-3", name: "Interstellar (2014).mp4", path: "", mimeType: "video/mp4", modifiedTime: "" },
      rating: 8.6,
      runtime: 169,
    },
    {
      id: "demo-4",
      folderId: "demo-folder-4",
      title: "The Matrix",
      year: 1999,
      path: "The Matrix (1999).mp4",
      file: { id: "demo-4", name: "The Matrix (1999).mp4", path: "", mimeType: "video/mp4", modifiedTime: "" },
      rating: 8.7,
      runtime: 136,
    },
    {
      id: "demo-5",
      folderId: "demo-folder-5",
      title: "Pulp Fiction",
      year: 1994,
      path: "Pulp Fiction (1994).mp4",
      file: { id: "demo-5", name: "Pulp Fiction (1994).mp4", path: "", mimeType: "video/mp4", modifiedTime: "" },
      rating: 8.9,
      runtime: 154,
    },
  ],
  tvShows: [
    {
      id: "demo-tv-1",
      title: "Breaking Bad",
      year: 2008,
      path: "Breaking Bad (2008)",
      seasons: [{ seasonNumber: 1, episodes: [], episodeCount: 7 }],
      totalEpisodes: 62,
      overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
      rating: 9.5,
    },
    {
      id: "demo-tv-2",
      title: "Game of Thrones",
      year: 2011,
      path: "Game of Thrones (2011)",
      seasons: [{ seasonNumber: 1, episodes: [], episodeCount: 10 }],
      totalEpisodes: 73,
      rating: 9.2,
    },
    {
      id: "demo-tv-3",
      title: "The Office (US)",
      year: 2005,
      path: "The Office (US) (2005)",
      seasons: [{ seasonNumber: 1, episodes: [], episodeCount: 6 }],
      totalEpisodes: 201,
      rating: 9.0,
    },
    {
      id: "demo-tv-4",
      title: "Stranger Things",
      year: 2016,
      path: "Stranger Things (2016)",
      seasons: [{ seasonNumber: 1, episodes: [], episodeCount: 8 }],
      totalEpisodes: 34,
      rating: 8.7,
    },
  ],
  lastScanned: new Date().toISOString(),
};

async function getMediaLibrary(): Promise<MediaLibrary> {
  const isConfigured = Boolean(
    process.env.GD_SERVICE_B64 &&
    process.env.GD_ROOT_FOLDER
  );

  if (!isConfigured) {
    return demoLibrary;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/scan`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch library");
    }

    return response.json();
  } catch (error) {
    console.error("Failed to load library:", error);
    return demoLibrary;
  }
}

export default async function HomePage() {
  const library = await getMediaLibrary();

  const featuredMovie = library.movies.length > 0
    ? library.movies[Math.floor(Math.random() * Math.min(5, library.movies.length))]
    : null;

  return (
    <div className="min-h-screen">
      {featuredMovie ? (
        <HeroBanner media={featuredMovie} type="movie" />
      ) : (
        <HeroBannerSkeleton />
      )}

      <div className="-mt-32 relative z-10 space-y-8 pb-16">
        {library.movies.length > 0 && (
          <MediaCarousel
            title="Movies"
            items={library.movies}
            type="movie"
          />
        )}

        {library.tvShows.length > 0 && (
          <MediaCarousel
            title="TV Shows"
            items={library.tvShows}
            type="tvshow"
          />
        )}

        {library.movies.length > 0 && (
          <MediaCarousel
            title="Recently Added"
            items={[...library.movies].reverse().slice(0, 10)}
            type="movie"
          />
        )}
      </div>

      {!process.env.GD_SERVICE_B64 && (
        <div className="fixed bottom-4 right-4 bg-yellow-500/90 text-black px-4 py-2 rounded-lg text-sm font-medium">
          ⚠️ Demo Mode - Configure .env to connect Google Drive
        </div>
      )}
    </div>
  );
}
