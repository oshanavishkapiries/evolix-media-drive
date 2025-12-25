/**
 * Media Library Type Definitions
 */

export type MediaType = "movie" | "tvshow";

export interface MediaFile {
  id: string;
  encryptedId: string;
  name: string;
  path: string;
  mimeType: string;
  size?: number;
  modifiedTime: string;
}

export interface Movie {
  id: string;
  encryptedId: string;
  title: string;
  year?: number;
  path: string;
  file: MediaFile;
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
  encryptedId: string;
  seasonNumber: number;
  episodeNumber: number;
  title?: string;
  airDate?: string;
  path: string;
  file: MediaFile;
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
  encryptedId: string;
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
  episodeEndNumber?: number; // For multi-episode files like s02e01-e03
  episodeTitle?: string;
  part?: number; // For multi-part episodes
  date?: string; // For date-based episodes like "2011-11-15"
  tmdbId?: number;
  tvdbId?: number;
  extension: string;
  type: MediaType;
}

export interface WatchProgress {
  mediaId: string;
  mediaType: MediaType;
  progress: number; // Percentage 0-100
  currentTime: number; // Seconds
  duration: number; // Seconds
  lastWatched: string; // ISO date
  seasonNumber?: number;
  episodeNumber?: number;
}
