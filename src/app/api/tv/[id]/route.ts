import { NextResponse } from "next/server";
import {
  listFolderContents,
  getFileMetadata,
  listSubfolders,
} from "@/lib/gdrive";
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
  getTVShowDetails,
  searchTVShow,
  isTMDBConfigured,
  getTMDBImageUrl,
  getSeasonDetails,
} from "@/lib/tmdb";
import type {
  TVShow,
  Season,
  Episode,
  MediaFile,
  SubtitleFile,
} from "@/types/media";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
 * Get a single TV show by folder ID
 * GET /api/tv/[id]
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: folderId } = await params;

    const folderMetadata = await getFileMetadata(folderId);
    if (!folderMetadata) {
      return NextResponse.json({ error: "TV show not found" }, { status: 404 });
    }

    const parsed = parseTVShowFolder(folderMetadata.name);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse folder name" },
        { status: 400 }
      );
    }

    const seasonFolders = await listSubfolders(folderId);
    const seasons: Season[] = [];
    let totalEpisodes = 0;

    for (const seasonFolder of seasonFolders) {
      const seasonNumber = parseSeasonFolder(seasonFolder.name);
      if (seasonNumber === null) continue;

      const { files: allFilesInSeason } = await listFolderContents(
        seasonFolder.id
      );
      const episodes: Episode[] = [];

      for (const file of allFilesInSeason) {
        if (!isVideoFile(file.name)) continue;

        const episodeParsed = parseMediaFilename(file.name);
        if (!episodeParsed || episodeParsed.episodeNumber === undefined)
          continue;

        const subtitles = findMatchingSubtitles(file.name, allFilesInSeason);

        const episode: Episode = {
          id: file.id,
          folderId: seasonFolder.id, // Season folder for subtitle lookup
          seasonNumber: episodeParsed.seasonNumber || seasonNumber,
          episodeNumber: episodeParsed.episodeNumber,
          title: episodeParsed.episodeTitle,
          path: file.name,
          file: {
            id: file.id,
            name: file.name,
            path: file.name,
            mimeType: file.mimeType,
            size: file.size ? parseInt(file.size, 10) : undefined,
            modifiedTime: file.modifiedTime || "",
          } as MediaFile,
          subtitles: subtitles.length > 0 ? subtitles : undefined,
          thumbnail: file.thumbnailLink || undefined,
        };

        episodes.push(episode);
        totalEpisodes++;
      }

      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

      seasons.push({
        seasonNumber,
        episodes,
        episodeCount: episodes.length,
      });
    }

    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);

    const tvShow: TVShow = {
      id: folderId,
      title: parsed.title,
      year: parsed.year,
      path: folderMetadata.name,
      seasons,
      totalEpisodes,
      tmdbId: parsed.tmdbId,
      tvdbId: parsed.tvdbId,
    };

    if (isTMDBConfigured()) {
      let tmdbData = null;
      if (parsed.tmdbId) {
        tmdbData = await getTVShowDetails(parsed.tmdbId);
      } else {
        const searchResult = await searchTVShow(parsed.title, parsed.year);
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

        if (tmdbData.seasons) {
          for (const season of seasons) {
            const tmdbSeason = tmdbData.seasons.find(
              (s) => s.season_number === season.seasonNumber
            );
            if (tmdbSeason?.poster_path) {
              season.poster = getTMDBImageUrl(tmdbSeason.poster_path, "w300");
            }
          }
        }

        const tmdbId = tvShow.tmdbId;
        if (tmdbId) {
          for (const season of seasons) {
            const episodeDetails = await getSeasonDetails(
              tmdbId,
              season.seasonNumber
            );
            if (episodeDetails) {
              for (const episode of season.episodes) {
                const tmdbEpisode = episodeDetails.find(
                  (e) => e.episodeNumber === episode.episodeNumber
                );
                if (tmdbEpisode) {
                  if (!episode.thumbnail && tmdbEpisode.stillUrl) {
                    episode.thumbnail = tmdbEpisode.stillUrl;
                  }
                  if (!episode.title && tmdbEpisode.name) {
                    episode.title = tmdbEpisode.name;
                  }
                  if (!episode.overview && tmdbEpisode.overview) {
                    episode.overview = tmdbEpisode.overview;
                  }
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json(tvShow);
  } catch (error) {
    console.error("Error fetching TV show:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV show" },
      { status: 500 }
    );
  }
}
