/**
 * File API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /files/{filename} (operationId: FileController_getFile)
 * - POST /files (operationId: FileController_uploadFiles)
 * - DELETE /files/{filename} (operationId: FileController_deleteFile)
 * - DELETE /files/clear (operationId: FileController_clearAllFiles)
 */

import { getApiClient } from "../client";
import type {
  FileUploadResponse,
  FileDeleteResponse,
  ClearAllFilesResponse,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
  FileUploadResponse,
  FileDeleteResponse,
  ClearAllFilesResponse,
};

// Aliases for backward compatibility
export type UploadFileResponse = FileUploadResponse;
export type DeleteFileResponse = FileDeleteResponse;

/**
 * File input for React Native uploads
 */
export interface FileInput {
  uri: string;
  type?: string;
  name?: string;
}

export const filesApi = {
  /**
   * Upload a file (multipart/form-data)
   * Maximum file size: 100MB
   * Operation: FileController_uploadFiles
   * Endpoint: POST /files
   * 
   * @param file - File object (File/Blob for web, FileInput for React Native)
   */
  uploadFile: (file: File | Blob | FileInput): Promise<FileUploadResponse> => {
    const client = getApiClient();
    const formData = new FormData();

    // Handle different file types
    if (file instanceof File || file instanceof Blob) {
      formData.append("file", file);
    } else if (file.uri) {
      // React Native file upload
      // @ts-ignore - React Native FormData has different types
      formData.append("file", {
        uri: file.uri,
        type: file.type || "application/octet-stream",
        name: file.name || `file-${Date.now()}`,
      } as any);
    } else {
      throw new Error("Invalid file input");
    }

    return client.request<FileUploadResponse>("/files", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Get/serve a file (public, no auth required)
   * Operation: FileController_getFile
   * Endpoint: GET /files/{filename}
   * 
   * @param filename - Name of the file to serve
   * @returns File blob/data
   */
  getFile: (filename: string): Promise<Blob> => {
    const client = getApiClient();
    return client.request<Blob>(`/files/${filename}`, {
      skipAuth: true,
      skipErrorHandling: false,
    });
  },

  /**
   * Delete a file
   * Operation: FileController_deleteFile
   * Endpoint: DELETE /files/{filename}
   * 
   * @param filename - Name of the file to delete
   */
  deleteFile: (filename: string): Promise<FileDeleteResponse> => {
    const client = getApiClient();
    return client.delete<FileDeleteResponse>(`/files/${filename}`);
  },

  /**
   * Clear all files (admin only)
   * Operation: FileController_clearAllFiles
   * Endpoint: DELETE /files/clear
   */
  clearAllFiles: (): Promise<ClearAllFilesResponse> => {
    const client = getApiClient();
    return client.delete<ClearAllFilesResponse>("/files/clear");
  },
};

