/**
 * Media Library Type Definitions
 * Simplified - using plain Google Drive IDs (no encryption)
 */

export type MediaType = "movie" | "tvshow";

export interface MediaFile {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  size?: number;
  modifiedTime: string;
}

export interface SubtitleFile {
  id: string;
  name: string;
  language: string; // e.g., "en", "es"
  label: string; // e.g., "English", "Spanish"
}

export interface Movie {
  id: string;
  folderId: string; // Parent folder ID for subtitle lookup
  title: string;
  year?: number;
  path: string;
  file: MediaFile;
  subtitles?: SubtitleFile[];
  thumbnail?: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  rating?: number;
  runtime?: number;
  tmdbId?: number;
}

export interface Episode {
  id: string;
  folderId: string; // Season folder ID for subtitle lookup
  seasonNumber: number;
  episodeNumber: number;
  title?: string;
  airDate?: string;
  path: string;
  file: MediaFile;
  subtitles?: SubtitleFile[];
  thumbnail?: string;
  overview?: string;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
  episodeCount: number;
  poster?: string;
}

export interface TVShow {
  id: string;
  title: string;
  year?: number;
  path: string;
  seasons: Season[];
  totalEpisodes: number;
  thumbnail?: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  rating?: number;
  tmdbId?: number;
  tvdbId?: number;
}

export interface MediaLibrary {
  movies: Movie[];
  tvShows: TVShow[];
  lastScanned?: string;
}

export interface ParsedFilename {
  title: string;
  year?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeEndNumber?: number;
  episodeTitle?: string;
  part?: number;
  date?: string;
  tmdbId?: number;
  tvdbId?: number;
  extension: string;
  type: MediaType;
}

export interface WatchProgress {
  mediaId: string;
  mediaType: MediaType;
  progress: number;
  currentTime: number;
  duration: number;
  lastWatched: string;
  seasonNumber?: number;
  episodeNumber?: number;
}
