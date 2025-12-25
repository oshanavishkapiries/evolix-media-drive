import { NextResponse } from "next/server";
import { getSubtitleContent, getFileMetadata } from "@/lib/gdrive";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Stream/convert subtitle file
 * GET /api/subtitle/[id]
 *
 * Converts SRT to VTT format if needed (browsers only support VTT natively)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: fileId } = await params;

    // Get file metadata to check extension
    const metadata = await getFileMetadata(fileId);
    if (!metadata) {
      return NextResponse.json(
        { error: "Subtitle not found" },
        { status: 404 }
      );
    }

    // Get the subtitle content
    const content = await getSubtitleContent(fileId);
    const extension = metadata.name.split(".").pop()?.toLowerCase();

    // Convert SRT to VTT if necessary (browsers only support VTT natively)
    let vttContent: string;

    if (extension === "srt") {
      vttContent = convertSrtToVtt(content);
    } else if (extension === "vtt") {
      vttContent = content;
    } else {
      // For other formats, try to convert or return as-is
      vttContent = convertSrtToVtt(content);
    }

    return new Response(vttContent, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error serving subtitle:", error);
    return NextResponse.json(
      { error: "Failed to serve subtitle" },
      { status: 500 }
    );
  }
}

/**
 * Convert SRT format to WebVTT format
 */
function convertSrtToVtt(srtContent: string): string {
  let vttContent = "WEBVTT\n\n";

  // Normalize line endings
  const normalized = srtContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Replace SRT timestamp format with VTT format
  // SRT: 00:00:00,000 --> 00:00:04,000
  // VTT: 00:00:00.000 --> 00:00:04.000
  const converted = normalized.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");

  // Remove numbered cue identifiers
  const lines = converted.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip pure numeric lines (subtitle numbers)
    if (/^\d+$/.test(line)) {
      continue;
    }

    result.push(lines[i]);
  }

  vttContent += result.join("\n");

  return vttContent;
}
