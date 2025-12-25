import { NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";
import { getFileMetadata } from "@/lib/gdrive";
import { parseMediaFilename } from "@/lib/parser";
import { getMovieDetails, searchMovie, isTMDBConfigured } from "@/lib/tmdb";
import type { Movie } from "@/types/media";
import { encrypt } from "@/lib/encryption";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Get a single movie by encrypted ID
 * GET /api/movie/[id]
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: encryptedId } = await params;

    // Decrypt the file ID
    const fileId = decrypt(encryptedId);
    if (!fileId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Get file metadata from Google Drive
    const fileMetadata = await getFileMetadata(fileId);
    if (!fileMetadata) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Parse the filename
    const parsed = parseMediaFilename(fileMetadata.name);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse filename" },
        { status: 400 }
      );
    }

    // Build the movie object
    const movie: Movie = {
      id: fileId,
      encryptedId,
      title: parsed.title,
      year: parsed.year,
      path: fileMetadata.name,
      file: {
        id: fileId,
        encryptedId: encrypt(fileId),
        name: fileMetadata.name,
        path: fileMetadata.name,
        mimeType: fileMetadata.mimeType,
        size: fileMetadata.size ? parseInt(fileMetadata.size, 10) : undefined,
        modifiedTime: fileMetadata.modifiedTime || "",
      },
      thumbnail: fileMetadata.thumbnailLink || undefined,
      tmdbId: parsed.tmdbId,
    };

    // Fetch TMDB data if configured
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
