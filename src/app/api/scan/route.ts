import { NextResponse } from "next/server";
import { findFolder, listSubfolders, listFolderContents } from "@/lib/gdrive";
import type { DriveFile } from "@/lib/gdrive";
import {
  parseMediaFilename,
  parseTVShowFolder,
  parseSeasonFolder,
  isVideoFile,
  isSubtitleFile,
  parseSubtitleLanguage,
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
  SubtitleFile,
} from "@/types/media";

export const dynamic = "force-dynamic";

/**
 * Find subtitle files that match a video file's base name
 */
function findMatchingSubtitles(
  videoFileName: string,
  allFiles: DriveFile[]
): SubtitleFile[] {
  const subtitles: SubtitleFile[] = [];

  const videoBaseName = videoFileName
    .substring(0, videoFileName.lastIndexOf("."))
    .trim();
  if (!videoBaseName) return [];

  for (const file of allFiles) {
    if (!isSubtitleFile(file.name)) continue;

    const subtitleName = file.name.trim();
    const subtitleBaseName = subtitleName
      .substring(0, subtitleName.lastIndexOf("."))
      .trim();

    const matches =
      subtitleBaseName === videoBaseName ||
      subtitleBaseName.startsWith(videoBaseName + ".") ||
      subtitleBaseName.startsWith(videoBaseName);

    if (matches) {
      const { language, label } = parseSubtitleLanguage(file.name);
      subtitles.push({
        id: file.id,
        name: file.name,
        language,
        label,
      });
    }
  }

  return subtitles;
}

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
 * Scan Movies folder
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
        const subMovies = await scanMoviesFolder(file.id);
        movies.push(...subMovies);
      } else if (isVideoFile(file.name)) {
        const parsed = parseMediaFilename(file.name);
        if (parsed) {
          const subtitles = findMatchingSubtitles(file.name, files);

          const movie: Movie = {
            id: file.id,
            folderId: folderId, // Store folder for subtitle lookup
            title: parsed.title,
            year: parsed.year,
            path: file.name,
            file: {
              id: file.id,
              name: file.name,
              path: file.name,
              mimeType: file.mimeType,
              size: file.size ? parseInt(file.size, 10) : undefined,
              modifiedTime: file.modifiedTime || "",
            },
            subtitles: subtitles.length > 0 ? subtitles : undefined,
            thumbnail: file.thumbnailLink || undefined,
            tmdbId: parsed.tmdbId,
          };

          if (tmdbEnabled) {
            let tmdbData = null;
            if (parsed.tmdbId) {
              tmdbData = await getMovieDetails(parsed.tmdbId);
            } else {
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
      const { files: allFilesInSeason } = await listFolderContents(
        seasonFolder.id
      );

      for (const file of allFilesInSeason) {
        if (!isVideoFile(file.name)) continue;

        const parsed = parseMediaFilename(file.name);
        if (!parsed || parsed.seasonNumber === undefined) continue;

        const subtitles = findMatchingSubtitles(file.name, allFilesInSeason);

        episodes.push({
          id: file.id,
          folderId: seasonFolder.id, // Store season folder for subtitle lookup
          seasonNumber: parsed.seasonNumber,
          episodeNumber: parsed.episodeNumber || 1,
          title: parsed.episodeTitle,
          path: `${showFolder.name}/${seasonFolder.name}/${file.name}`,
          file: {
            id: file.id,
            name: file.name,
            path: file.name,
            mimeType: file.mimeType,
            size: file.size ? parseInt(file.size, 10) : undefined,
            modifiedTime: file.modifiedTime || "",
          },
          subtitles: subtitles.length > 0 ? subtitles : undefined,
          thumbnail: file.thumbnailLink || undefined,
        });
      }

      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

      if (episodes.length > 0) {
        seasons.push({
          seasonNumber,
          episodes,
          episodeCount: episodes.length,
        });
      }
    }

    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);

    if (seasons.length > 0) {
      const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodeCount, 0);

      const tvShow: TVShow = {
        id: showFolder.id,
        title: showInfo.title,
        year: showInfo.year,
        path: showFolder.name,
        seasons,
        totalEpisodes,
        tmdbId: showInfo.tmdbId,
        tvdbId: showInfo.tvdbId,
      };

      if (isTMDBConfigured()) {
        let tmdbData = null;
        if (showInfo.tmdbId) {
          tmdbData = await getTVShowDetails(showInfo.tmdbId);
        } else {
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
