import { NextResponse } from "next/server";
import { findFolder, listSubfolders, listFolderContents } from "@/lib/gdrive";
import { encrypt } from "@/lib/encryption";
import {
  parseMediaFilename,
  parseTVShowFolder,
  parseSeasonFolder,
  isVideoFile,
} from "@/lib/parser";
import {
  getMovieDetails,
  getTVShowDetails,
  searchMovie,
  searchTVShow,
  isTMDBConfigured,
} from "@/lib/tmdb";
import type {
  Movie,
  TVShow,
  Season,
  Episode,
  MediaLibrary,
} from "@/types/media";

export const dynamic = "force-dynamic";

/**
 * Scan the Media folder structure and return organized library
 * GET /api/scan
 */
export async function GET() {
  try {
    const library: MediaLibrary = {
      movies: [],
      tvShows: [],
      lastScanned: new Date().toISOString(),
    };

    // Find the Movies folder
    const moviesFolder = await findFolder("Movies");
    if (moviesFolder) {
      library.movies = await scanMoviesFolder(moviesFolder.id);
    }

    // Find the TV Shows folder
    const tvShowsFolder = await findFolder("TV Shows");
    if (tvShowsFolder) {
      library.tvShows = await scanTVShowsFolder(tvShowsFolder.id);
    }

    return NextResponse.json(library);
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan media library" },
      { status: 500 }
    );
  }
}

/**
 * Scan Movies folder - each video file is a movie
 */
async function scanMoviesFolder(folderId: string): Promise<Movie[]> {
  const movies: Movie[] = [];
  let pageToken: string | undefined;
  const tmdbEnabled = isTMDBConfigured();

  do {
    const { files, nextPageToken } = await listFolderContents(
      folderId,
      pageToken
    );
    pageToken = nextPageToken;

    for (const file of files) {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        // Movie might be in a subfolder - scan it
        const subMovies = await scanMoviesFolder(file.id);
        movies.push(...subMovies);
      } else if (isVideoFile(file.name)) {
        const parsed = parseMediaFilename(file.name);
        if (parsed) {
          const movie: Movie = {
            id: file.id,
            encryptedId: encrypt(file.id),
            title: parsed.title,
            year: parsed.year,
            path: file.name,
            file: {
              id: file.id,
              encryptedId: encrypt(file.id),
              name: file.name,
              path: file.name,
              mimeType: file.mimeType,
              size: file.size ? parseInt(file.size, 10) : undefined,
              modifiedTime: file.modifiedTime || "",
            },
            thumbnail: file.thumbnailLink || undefined,
            tmdbId: parsed.tmdbId,
          };

          // Fetch TMDB metadata if available
          if (tmdbEnabled) {
            let tmdbData = null;

            if (parsed.tmdbId) {
              // Use the explicit TMDB ID from filename
              tmdbData = await getMovieDetails(parsed.tmdbId);
            } else {
              // Search by title and year
              const searchResult = await searchMovie(parsed.title, parsed.year);
              if (searchResult) {
                movie.tmdbId = searchResult.id;
                tmdbData = await getMovieDetails(searchResult.id);
              }
            }

            if (tmdbData) {
              movie.poster = tmdbData.posterUrl;
              movie.backdrop = tmdbData.backdropUrl;
              movie.overview = tmdbData.overview;
              movie.rating = tmdbData.rating;
              movie.runtime = tmdbData.runtime;
            }
          }

          movies.push(movie);
        }
      }
    }
  } while (pageToken);

  return movies;
}

/**
 * Scan TV Shows folder structure
 * /TV Shows/Show Name (Year)/Season XX/Episode files
 */
async function scanTVShowsFolder(folderId: string): Promise<TVShow[]> {
  const tvShows: TVShow[] = [];
  const showFolders = await listSubfolders(folderId);

  for (const showFolder of showFolders) {
    const showInfo = parseTVShowFolder(showFolder.name);
    if (!showInfo) continue;

    const seasons: Season[] = [];
    const seasonFolders = await listSubfolders(showFolder.id);

    for (const seasonFolder of seasonFolders) {
      const seasonNumber = parseSeasonFolder(seasonFolder.name);
      if (seasonNumber === null) continue;

      const episodes: Episode[] = [];
      const { files: episodeFiles } = await listFolderContents(seasonFolder.id);

      for (const file of episodeFiles) {
        if (!isVideoFile(file.name)) continue;

        const parsed = parseMediaFilename(file.name);
        if (!parsed || parsed.seasonNumber === undefined) continue;

        episodes.push({
          id: file.id,
          encryptedId: encrypt(file.id),
          seasonNumber: parsed.seasonNumber,
          episodeNumber: parsed.episodeNumber || 1,
          title: parsed.episodeTitle,
          path: `${showFolder.name}/${seasonFolder.name}/${file.name}`,
          file: {
            id: file.id,
            encryptedId: encrypt(file.id),
            name: file.name,
            path: file.name,
            mimeType: file.mimeType,
            size: file.size ? parseInt(file.size, 10) : undefined,
            modifiedTime: file.modifiedTime || "",
          },
          thumbnail: file.thumbnailLink || undefined,
        });
      }

      // Sort episodes by episode number
      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

      if (episodes.length > 0) {
        seasons.push({
          seasonNumber,
          episodes,
          episodeCount: episodes.length,
        });
      }
    }

    // Sort seasons by season number
    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);

    if (seasons.length > 0) {
      const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodeCount, 0);

      const tvShow: TVShow = {
        id: showFolder.id,
        encryptedId: encrypt(showFolder.id),
        title: showInfo.title,
        year: showInfo.year,
        path: showFolder.name,
        seasons,
        totalEpisodes,
        tmdbId: showInfo.tmdbId,
        tvdbId: showInfo.tvdbId,
      };

      // Fetch TMDB metadata if available
      if (isTMDBConfigured()) {
        let tmdbData = null;

        if (showInfo.tmdbId) {
          // Use the explicit TMDB ID from folder name
          tmdbData = await getTVShowDetails(showInfo.tmdbId);
        } else {
          // Search by title and year
          const searchResult = await searchTVShow(
            showInfo.title,
            showInfo.year
          );
          if (searchResult) {
            tvShow.tmdbId = searchResult.id;
            tmdbData = await getTVShowDetails(searchResult.id);
          }
        }

        if (tmdbData) {
          tvShow.poster = tmdbData.posterUrl;
          tvShow.backdrop = tmdbData.backdropUrl;
          tvShow.overview = tmdbData.overview;
          tvShow.rating = tmdbData.rating;
        }
      }

      tvShows.push(tvShow);
    }
  }

  return tvShows;
}
