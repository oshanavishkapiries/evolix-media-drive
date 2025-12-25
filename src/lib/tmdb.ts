/**
 * TMDB API integration for fetching movie/TV metadata
 * Get a free API key at: https://www.themoviedb.org/settings/api
 */

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name: string }[];
  seasons?: {
    season_number: number;
    poster_path: string | null;
    episode_count: number;
  }[];
}

export interface TMDBMetadata {
  title?: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  rating?: number;
  runtime?: number;
  releaseDate?: string;
  genres?: string[];
  seasons?: {
    season_number: number;
    poster_path: string | null;
    episode_count: number;
  }[];
}

/**
 * Check if TMDB is configured
 */
export function isTMDBConfigured(): boolean {
  return Boolean(TMDB_API_KEY);
}

/**
 * Get full image URL from TMDB path
 */
export function getTMDBImageUrl(
  path: string | null,
  size: "w200" | "w300" | "w500" | "w780" | "original" = "w500"
): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/**
 * Fetch movie details by TMDB ID
 */
export async function getMovieDetails(
  tmdbId: number
): Promise<TMDBMetadata | null> {
  if (!TMDB_API_KEY) {
    console.warn("TMDB_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      console.error(`TMDB API error: ${response.status}`);
      return null;
    }

    const data: TMDBMovieDetails = await response.json();

    return {
      title: data.title,
      overview: data.overview,
      posterUrl: getTMDBImageUrl(data.poster_path, "w500"),
      backdropUrl: getTMDBImageUrl(data.backdrop_path, "w780"),
      rating: data.vote_average,
      runtime: data.runtime || undefined,
      releaseDate: data.release_date,
      genres: data.genres.map((g) => g.name),
    };
  } catch (error) {
    console.error("Failed to fetch TMDB movie details:", error);
    return null;
  }
}

/**
 * Fetch TV show details by TMDB ID
 */
export async function getTVShowDetails(
  tmdbId: number
): Promise<TMDBMetadata | null> {
  if (!TMDB_API_KEY) {
    console.warn("TMDB_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      console.error(`TMDB API error: ${response.status}`);
      return null;
    }

    const data: TMDBTVDetails = await response.json();

    return {
      title: data.name,
      overview: data.overview,
      posterUrl: getTMDBImageUrl(data.poster_path, "w500"),
      backdropUrl: getTMDBImageUrl(data.backdrop_path, "w780"),
      rating: data.vote_average,
      releaseDate: data.first_air_date,
      genres: data.genres.map((g) => g.name),
      seasons: data.seasons,
    };
  } catch (error) {
    console.error("Failed to fetch TMDB TV details:", error);
    return null;
  }
}

export interface TMDBEpisodeInfo {
  episodeNumber: number;
  name: string;
  overview: string;
  stillUrl?: string;
}

/**
 * Fetch season details including episode stills
 */
export async function getSeasonDetails(
  tvShowId: number,
  seasonNumber: number
): Promise<TMDBEpisodeInfo[] | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tvShowId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) return null;

    const data = await response.json();

    return (
      data.episodes?.map(
        (ep: {
          episode_number: number;
          name: string;
          overview: string;
          still_path: string | null;
        }) => ({
          episodeNumber: ep.episode_number,
          name: ep.name,
          overview: ep.overview,
          stillUrl: getTMDBImageUrl(ep.still_path, "w300"),
        })
      ) || []
    );
  } catch (error) {
    console.error("Failed to fetch TMDB season details:", error);
    return null;
  }
}

/**
 * Search for a movie by title and year
 */
export async function searchMovie(
  title: string,
  year?: number
): Promise<{ id: number; posterUrl?: string } | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      query: title,
      ...(year && { year: year.toString() }),
    });

    const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) return null;

    return {
      id: result.id,
      posterUrl: getTMDBImageUrl(result.poster_path, "w500"),
    };
  } catch {
    return null;
  }
}

/**
 * Search for a TV show by title and year
 */
export async function searchTVShow(
  title: string,
  year?: number
): Promise<{ id: number; posterUrl?: string } | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      query: title,
      ...(year && { first_air_date_year: year.toString() }),
    });

    const response = await fetch(`${TMDB_BASE_URL}/search/tv?${params}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) return null;

    return {
      id: result.id,
      posterUrl: getTMDBImageUrl(result.poster_path, "w500"),
    };
  } catch {
    return null;
  }
}
