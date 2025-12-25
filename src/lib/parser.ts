import type { ParsedFilename } from "@/types/media";

/**
 * Parse media filename to extract metadata
 * Supports various naming conventions:
 * - "Show Name (2005) - s01e02 - Episode Title.mkv"
 * - "Show Name (2005) - s01e01-e03.avi" (multi-episode)
 * - "Show Name (2005) - s01e01 - pt1.avi" (multi-part)
 * - "Show Name (2005) - 2011-11-15 - Guest Name.avi" (dated episodes)
 * - "Movie Name (2020).mp4"
 * - "Show Name (2005) {tmdb-12345}" or "{tvdb-12345}"
 */
export function parseMediaFilename(filename: string): ParsedFilename | null {
  // Get extension
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (!extMatch) return null;

  const extension = extMatch[1].toLowerCase();
  const nameWithoutExt = filename.slice(0, -extMatch[0].length);

  // Check for TMDB/TVDB IDs
  let tmdbId: number | undefined;
  let tvdbId: number | undefined;

  const tmdbMatch = nameWithoutExt.match(/\{tmdb-(\d+)\}/i);
  if (tmdbMatch) {
    tmdbId = parseInt(tmdbMatch[1], 10);
  }

  const tvdbMatch = nameWithoutExt.match(/\{tvdb-(\d+)\}/i);
  if (tvdbMatch) {
    tvdbId = parseInt(tvdbMatch[1], 10);
  }

  // Remove IDs from name for further parsing
  let cleanName = nameWithoutExt
    .replace(/\{tmdb-\d+\}/gi, "")
    .replace(/\{tvdb-\d+\}/gi, "")
    .trim();

  // Try to match TV show episode pattern: s01e02 or S01E02
  const episodeMatch = cleanName.match(
    /^(.+?)\s*\((\d{4})\)?\s*-\s*s(\d+)e(\d+)(?:-e(\d+))?(?:\s*-\s*(?:pt(\d+)|(.+)))?$/i
  );

  if (episodeMatch) {
    const [, title, year, season, episode, endEpisode, part, episodeTitle] =
      episodeMatch;
    return {
      title: title.trim(),
      year: year ? parseInt(year, 10) : undefined,
      seasonNumber: parseInt(season, 10),
      episodeNumber: parseInt(episode, 10),
      episodeEndNumber: endEpisode ? parseInt(endEpisode, 10) : undefined,
      part: part ? parseInt(part, 10) : undefined,
      episodeTitle: episodeTitle?.trim(),
      extension,
      type: "tvshow",
      tmdbId,
      tvdbId,
    };
  }

  // Try to match dated episode pattern: 2011-11-15
  const datedMatch = cleanName.match(
    /^(.+?)\s*\((\d{4})\)?\s*-\s*(\d{4}-\d{2}-\d{2})(?:\s*-\s*(.+))?$/i
  );

  if (datedMatch) {
    const [, title, year, date, episodeTitle] = datedMatch;
    return {
      title: title.trim(),
      year: year ? parseInt(year, 10) : undefined,
      date,
      episodeTitle: episodeTitle?.trim(),
      extension,
      type: "tvshow",
      tmdbId,
      tvdbId,
    };
  }

  // Try to match movie pattern: "Movie Name (2020)"
  const movieMatch = cleanName.match(/^(.+?)\s*\((\d{4})\)?$/);

  if (movieMatch) {
    const [, title, year] = movieMatch;
    return {
      title: title.trim(),
      year: parseInt(year, 10),
      extension,
      type: "movie",
      tmdbId,
      tvdbId,
    };
  }

  // Fallback: treat as movie with just title
  return {
    title: cleanName.trim(),
    extension,
    type: "movie",
    tmdbId,
    tvdbId,
  };
}

/**
 * Parse folder name for TV show metadata
 * Examples:
 * - "Doctor Who (1963)"
 * - "The Office (UK) (2001) {tmdb-2996}"
 */
export function parseTVShowFolder(folderName: string): {
  title: string;
  year?: number;
  tmdbId?: number;
  tvdbId?: number;
} | null {
  let name = folderName.trim();

  // Extract TMDB/TVDB IDs
  let tmdbId: number | undefined;
  let tvdbId: number | undefined;

  const tmdbMatch = name.match(/\{tmdb-(\d+)\}/i);
  if (tmdbMatch) {
    tmdbId = parseInt(tmdbMatch[1], 10);
    name = name.replace(tmdbMatch[0], "").trim();
  }

  const tvdbMatch = name.match(/\{tvdb-(\d+)\}/i);
  if (tvdbMatch) {
    tvdbId = parseInt(tvdbMatch[1], 10);
    name = name.replace(tvdbMatch[0], "").trim();
  }

  // Extract year
  const yearMatch = name.match(/\((\d{4})\)\s*$/);
  let year: number | undefined;

  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
    name = name.replace(yearMatch[0], "").trim();
  }

  if (!name) return null;

  return {
    title: name,
    year,
    tmdbId,
    tvdbId,
  };
}

/**
 * Parse season folder name
 * Examples: "Season 01", "Season 1", "Specials" (Season 00)
 */
export function parseSeasonFolder(folderName: string): number | null {
  const match = folderName.match(/season\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  if (folderName.toLowerCase() === "specials") {
    return 0;
  }

  return null;
}

/**
 * Check if file is a video file
 */
export function isVideoFile(filename: string): boolean {
  const videoExtensions = [
    "mp4",
    "mkv",
    "avi",
    "mov",
    "wmv",
    "flv",
    "webm",
    "m4v",
    "mpg",
    "mpeg",
    "3gp",
  ];
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? videoExtensions.includes(ext) : false;
}
