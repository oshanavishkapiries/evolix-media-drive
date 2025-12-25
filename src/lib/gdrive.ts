"use server";

import { google, type drive_v3 } from "googleapis";
import { encrypt } from "./encryption";

let driveClient: drive_v3.Drive | null = null;

/**
 * Get or create Google Drive client
 */
function getDriveClient(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const serviceAccountB64 = process.env.GD_SERVICE_B64;
  if (!serviceAccountB64) {
    throw new Error("GD_SERVICE_B64 environment variable is not set");
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountB64, "base64").toString("utf-8")
  );

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  driveClient = google.drive({ version: "v3", auth });
  return driveClient;
}

/**
 * Get root folder ID from environment
 */
function getRootFolderId(): string {
  const rootFolder = process.env.GD_ROOT_FOLDER;
  if (!rootFolder) {
    throw new Error("GD_ROOT_FOLDER environment variable is not set");
  }
  return rootFolder;
}

/**
 * Check if using a shared/team drive
 */
function isTeamDrive(): boolean {
  return process.env.GD_IS_TEAM_DRIVE === "true";
}

/**
 * Get shared drive ID
 */
function getSharedDriveId(): string | undefined {
  return process.env.GD_SHARED_DRIVE_ID;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  parents?: string[];
}

/**
 * List files in a folder
 */
export async function listFolderContents(
  folderId?: string,
  pageToken?: string
): Promise<{
  files: DriveFile[];
  nextPageToken?: string;
}> {
  const drive = getDriveClient();
  const targetFolderId = folderId || getRootFolderId();

  const params: drive_v3.Params$Resource$Files$List = {
    q: `'${targetFolderId}' in parents and trashed = false`,
    fields:
      "nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, parents)",
    orderBy: "folder, name",
    pageSize: 100,
    pageToken: pageToken || undefined,
  };

  // Add team drive support
  if (isTeamDrive()) {
    params.supportsAllDrives = true;
    params.includeItemsFromAllDrives = true;
    const sharedDriveId = getSharedDriveId();
    if (sharedDriveId) {
      params.driveId = sharedDriveId;
      params.corpora = "drive";
    }
  }

  const response = await drive.files.list(params);

  return {
    files: (response.data.files || []) as DriveFile[],
    nextPageToken: response.data.nextPageToken || undefined,
  };
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  fileId: string
): Promise<DriveFile | null> {
  const drive = getDriveClient();

  try {
    const response = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, modifiedTime, thumbnailLink, parents",
      supportsAllDrives: isTeamDrive(),
    });

    return response.data as DriveFile;
  } catch {
    return null;
  }
}

/**
 * Get file stream for video playback
 */
export async function getFileStream(
  fileId: string,
  range?: { start: number; end?: number }
): Promise<{
  stream: NodeJS.ReadableStream;
  contentLength: number;
  contentType: string;
}> {
  const drive = getDriveClient();

  // First get file metadata for size
  const metadata = await drive.files.get({
    fileId,
    fields: "size, mimeType",
    supportsAllDrives: isTeamDrive(),
  });

  const fileSize = parseInt(metadata.data.size || "0", 10);
  const contentType = metadata.data.mimeType || "video/mp4";

  // Set range headers
  const headers: Record<string, string> = {};
  let contentLength = fileSize;

  if (range) {
    const start = range.start;
    const end = range.end ?? fileSize - 1;
    contentLength = end - start + 1;
    headers["Range"] = `bytes=${start}-${end}`;
  }

  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
      supportsAllDrives: isTeamDrive(),
    },
    {
      responseType: "stream",
      headers,
    }
  );

  return {
    stream: response.data as NodeJS.ReadableStream,
    contentLength,
    contentType,
  };
}

/**
 * Recursively list all contents of a folder (for scanning media library)
 */
export async function listFolderRecursive(
  folderId: string,
  path = ""
): Promise<Array<DriveFile & { path: string; encryptedId: string }>> {
  const result: Array<DriveFile & { path: string; encryptedId: string }> = [];
  let pageToken: string | undefined;

  do {
    const { files, nextPageToken } = await listFolderContents(
      folderId,
      pageToken
    );
    pageToken = nextPageToken;

    for (const file of files) {
      const filePath = path ? `${path}/${file.name}` : file.name;
      const encryptedId = encrypt(file.id);

      if (file.mimeType === "application/vnd.google-apps.folder") {
        // Recursively scan subfolders
        const subFiles = await listFolderRecursive(file.id, filePath);
        result.push(...subFiles);
      } else {
        result.push({
          ...file,
          path: filePath,
          encryptedId,
        });
      }
    }
  } while (pageToken);

  return result;
}

/**
 * Find a folder by name within a parent folder
 */
export async function findFolder(
  folderName: string,
  parentId?: string
): Promise<DriveFile | null> {
  const drive = getDriveClient();
  const parent = parentId || getRootFolderId();

  const params: drive_v3.Params$Resource$Files$List = {
    q: `'${parent}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name, mimeType)",
    pageSize: 1,
  };

  if (isTeamDrive()) {
    params.supportsAllDrives = true;
    params.includeItemsFromAllDrives = true;
  }

  const response = await drive.files.list(params);
  const files = response.data.files || [];

  return files.length > 0 ? (files[0] as DriveFile) : null;
}

/**
 * List immediate subfolders of a folder
 */
export async function listSubfolders(folderId: string): Promise<DriveFile[]> {
  const drive = getDriveClient();

  const params: drive_v3.Params$Resource$Files$List = {
    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name, mimeType)",
    orderBy: "name",
    pageSize: 1000,
  };

  if (isTeamDrive()) {
    params.supportsAllDrives = true;
    params.includeItemsFromAllDrives = true;
  }

  const response = await drive.files.list(params);
  return (response.data.files || []) as DriveFile[];
}
