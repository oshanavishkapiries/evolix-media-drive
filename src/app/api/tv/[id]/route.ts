import { NextResponse } from "next/server";
import { decrypt, encrypt } from "@/lib/encryption";
import {
  listFolderContents,
  getFileMetadata,
  listSubfolders,
} from "@/lib/gdrive";
import {
  parseMediaFilename,
  parseTVShowFolder,
  parseSeasonFolder,
  isVideoFile,
} from "@/lib/parser";
import {
  getTVShowDetails,
  searchTVShow,
  isTMDBConfigured,
  getTMDBImageUrl,
  getSeasonDetails,
} from "@/lib/tmdb";
import type { TVShow, Season, Episode, MediaFile } from "@/types/media";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Get a single TV show by encrypted folder ID
 * GET /api/tv/[id]
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: encryptedId } = await params;

    // Decrypt the folder ID
    const folderId = decrypt(encryptedId);
    if (!folderId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Get folder metadata
    const folderMetadata = await getFileMetadata(folderId);
    if (!folderMetadata) {
      return NextResponse.json({ error: "TV show not found" }, { status: 404 });
    }

    // Parse folder name
    const parsed = parseTVShowFolder(folderMetadata.name);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse folder name" },
        { status: 400 }
      );
    }

    // Get season folders
    const seasonFolders = await listSubfolders(folderId);
    const seasons: Season[] = [];
    let totalEpisodes = 0;

    // Process each season folder
    for (const seasonFolder of seasonFolders) {
      const seasonNumber = parseSeasonFolder(seasonFolder.name);
      if (seasonNumber === null) continue;

      // Get episodes in this season
      const { files } = await listFolderContents(seasonFolder.id);
      const episodes: Episode[] = [];

      for (const file of files) {
        if (!isVideoFile(file.name)) continue;

        const episodeParsed = parseMediaFilename(file.name);
        if (!episodeParsed || episodeParsed.episodeNumber === undefined)
          continue;

        const episode: Episode = {
          id: file.id,
          encryptedId: encrypt(file.id),
          seasonNumber: episodeParsed.seasonNumber || seasonNumber,
          episodeNumber: episodeParsed.episodeNumber,
          title: episodeParsed.episodeTitle,
          path: file.name,
          file: {
            id: file.id,
            encryptedId: encrypt(file.id),
            name: file.name,
            path: file.name,
            mimeType: file.mimeType,
            size: file.size ? parseInt(file.size, 10) : undefined,
            modifiedTime: file.modifiedTime || "",
          } as MediaFile,
          thumbnail: file.thumbnailLink || undefined,
        };

        episodes.push(episode);
        totalEpisodes++;
      }

      // Sort episodes by episode number
      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

      seasons.push({
        seasonNumber,
        episodes,
        episodeCount: episodes.length,
      });
    }

    // Sort seasons by season number
    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);

    // Build TV show object
    const tvShow: TVShow = {
      id: folderId,
      encryptedId,
      title: parsed.title,
      year: parsed.year,
      path: folderMetadata.name,
      seasons,
      totalEpisodes,
      tmdbId: parsed.tmdbId,
      tvdbId: parsed.tvdbId,
    };

    // Fetch TMDB data if configured
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

        // Add season posters if available
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

        // Fetch episode stills for each season
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
                  // Use TMDB still as thumbnail if no Google Drive thumbnail
                  if (!episode.thumbnail && tmdbEpisode.stillUrl) {
                    episode.thumbnail = tmdbEpisode.stillUrl;
                  }
                  // Add episode title and overview from TMDB if not already set
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
