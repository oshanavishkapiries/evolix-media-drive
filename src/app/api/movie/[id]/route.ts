import { NextResponse } from "next/server";
import { getFileMetadata, listFolderContents } from "@/lib/gdrive";
import type { DriveFile } from "@/lib/gdrive";
import {
  parseMediaFilename,
  isSubtitleFile,
  parseSubtitleLanguage,
} from "@/lib/parser";
import { getMovieDetails, searchMovie, isTMDBConfigured } from "@/lib/tmdb";
import type { Movie, SubtitleFile } from "@/types/media";

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
 * Get a single movie by ID
 * GET /api/movie/[id]
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: fileId } = await params;

    const fileMetadata = await getFileMetadata(fileId);
    if (!fileMetadata) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const parsed = parseMediaFilename(fileMetadata.name);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse filename" },
        { status: 400 }
      );
    }

    // Find subtitles
    let subtitles: SubtitleFile[] = [];
    if (fileMetadata.parents?.[0]) {
      const { files: allFilesInFolder } = await listFolderContents(
        fileMetadata.parents[0]
      );
      subtitles = findMatchingSubtitles(fileMetadata.name, allFilesInFolder);
    }

    const movie: Movie = {
      id: fileId,
      folderId: fileMetadata.parents?.[0] || "",
      title: parsed.title,
      year: parsed.year,
      path: fileMetadata.name,
      file: {
        id: fileId,
        name: fileMetadata.name,
        path: fileMetadata.name,
        mimeType: fileMetadata.mimeType,
        size: fileMetadata.size ? parseInt(fileMetadata.size, 10) : undefined,
        modifiedTime: fileMetadata.modifiedTime || "",
      },
      subtitles: subtitles.length > 0 ? subtitles : undefined,
      thumbnail: fileMetadata.thumbnailLink || undefined,
      tmdbId: parsed.tmdbId,
    };

    if (isTMDBConfigured()) {
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

    return NextResponse.json(movie);
  } catch (error) {
    console.error("Error fetching movie:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie" },
      { status: 500 }
    );
  }
}
