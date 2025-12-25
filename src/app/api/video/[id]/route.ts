import { NextResponse } from "next/server";
import { listFolderContents, getFileMetadata } from "@/lib/gdrive";
import type { DriveFile } from "@/lib/gdrive";
import {
  parseMediaFilename,
  isSubtitleFile,
  parseSubtitleLanguage,
} from "@/lib/parser";
import type { SubtitleFile } from "@/types/media";

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

export interface VideoInfo {
  id: string;
  folderId: string;
  title: string;
  year?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  streamUrl: string;
  subtitles: SubtitleFile[];
}

/**
 * Get video info including subtitles for the player
 * Pass folderId as query parameter: /api/video/[id]?folderId=xxx
 * GET /api/video/[id]
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: fileId } = await params;

    // Get folderId from query parameter
    const url = new URL(request.url);
    let folderId = url.searchParams.get("folderId");

    // If folderId is 'unknown' or missing, try to get it from file metadata
    if (!folderId || folderId === "unknown") {
      const fileMetadata = await getFileMetadata(fileId);
      if (!fileMetadata) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }
      folderId = fileMetadata.parents?.[0] || null;

      if (!folderId) {
        // Can't find folder, but still try to play without subtitles
        const parsed = parseMediaFilename(fileMetadata.name);
        return NextResponse.json({
          id: fileId,
          folderId: "",
          title: parsed?.title || "Unknown",
          year: parsed?.year,
          seasonNumber: parsed?.seasonNumber,
          episodeNumber: parsed?.episodeNumber,
          episodeTitle: parsed?.episodeTitle,
          streamUrl: `/api/stream/${fileId}`,
          subtitles: [],
        });
      }
    }

    // Get all files in the folder to find video name and subtitles
    const { files: allFilesInFolder } = await listFolderContents(folderId);

    // Find the video file
    const videoFile = allFilesInFolder.find((f) => f.id === fileId);
    if (!videoFile) {
      return NextResponse.json(
        { error: "Video not found in folder" },
        { status: 404 }
      );
    }

    // Parse the filename
    const parsed = parseMediaFilename(videoFile.name);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse filename" },
        { status: 400 }
      );
    }

    // Find subtitles in the same folder
    const subtitles = findMatchingSubtitles(videoFile.name, allFilesInFolder);

    const videoInfo: VideoInfo = {
      id: fileId,
      folderId,
      title: parsed.title,
      year: parsed.year,
      seasonNumber: parsed.seasonNumber,
      episodeNumber: parsed.episodeNumber,
      episodeTitle: parsed.episodeTitle,
      streamUrl: `/api/stream/${fileId}`,
      subtitles,
    };

    return NextResponse.json(videoInfo);
  } catch (error) {
    console.error("Error fetching video info:", error);
    return NextResponse.json(
      { error: "Failed to fetch video info" },
      { status: 500 }
    );
  }
}
