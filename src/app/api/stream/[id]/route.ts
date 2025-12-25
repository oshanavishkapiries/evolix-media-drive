import { type NextRequest, NextResponse } from "next/server";
import { getFileStream, getFileMetadata } from "@/lib/gdrive";

export const dynamic = "force-dynamic";

/**
 * Stream video file from Google Drive
 * GET /api/stream/[id]
 *
 * Supports range requests for seeking in video
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;

    // Get file metadata first
    const metadata = await getFileMetadata(fileId);
    if (!metadata) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileSize = parseInt(metadata.size || "0", 10);
    const rangeHeader = request.headers.get("range");

    // Parse range header for seeking
    let start = 0;
    let end = fileSize - 1;

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        start = parseInt(match[1], 10);
        end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      }
    }

    // Get the stream
    const { stream, contentType } = await getFileStream(fileId, { start, end });
    const contentLength = end - start + 1;

    // Create response with proper headers for range request
    const headers: HeadersInit = {
      "Content-Type": contentType,
      "Content-Length": contentLength.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    };

    if (rangeHeader) {
      headers["Content-Range"] = `bytes ${start}-${end}/${fileSize}`;
    }

    // Convert Node.js stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        stream.on("end", () => {
          controller.close();
        });
        stream.on("error", (err: Error) => {
          controller.error(err);
        });
      },
    });

    return new Response(webStream, {
      status: rangeHeader ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("Stream error:", error);
    return NextResponse.json(
      { error: "Failed to stream file" },
      { status: 500 }
    );
  }
}
