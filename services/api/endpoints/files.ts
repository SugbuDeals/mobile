/**
 * File API endpoints
 */

import { getApiClient } from "../client";

export interface UploadFileResponse {
  fileName: string;
  originalName: string;
  fileUrl: string;
  size: number;
  mimeType: string;
}

export interface DeleteFileResponse {
  message: string;
  fileName: string;
}

export interface ClearAllFilesResponse {
  message: string;
  deletedCount: number;
  totalFiles: number;
  errors?: string[];
}

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
   * @param file - File object (File/Blob for web, FileInput for React Native)
   */
  uploadFile: (file: File | Blob | FileInput): Promise<UploadFileResponse> => {
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

    return client.request<UploadFileResponse>("/files", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Get/serve a file (public, no auth required)
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
   * @param filename - Name of the file to delete
   */
  deleteFile: (filename: string): Promise<DeleteFileResponse> => {
    const client = getApiClient();
    return client.delete<DeleteFileResponse>(`/files/${filename}`);
  },

  /**
   * Clear all files (admin only)
   */
  clearAllFiles: (): Promise<ClearAllFilesResponse> => {
    const client = getApiClient();
    return client.delete<ClearAllFilesResponse>("/files/clear");
  },
};

