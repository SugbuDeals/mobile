import env from "@/config/env";

export interface UploadFileResponse {
  filename: string;
  url?: string;
}

/**
 * Uploads a file to the server using multipart/form-data
 * @param fileUri - The URI/path to the file (from expo-image-picker or similar)
 * @param accessToken - JWT access token for authentication
 * @returns Promise with the uploaded file information
 */
export async function uploadFile(
  fileUri: string,
  accessToken: string
): Promise<UploadFileResponse> {
  try {
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = fileUri.split('/').pop() || `file-${Date.now()}`;
    const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Determine MIME type based on extension
    let mimeType = 'image/jpeg';
    if (fileExtension === 'png') mimeType = 'image/png';
    else if (fileExtension === 'webp') mimeType = 'image/webp';
    else if (fileExtension === 'gif') mimeType = 'image/gif';
    
    // For React Native, we need to structure the file object correctly
    // @ts-ignore - React Native FormData has different types
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: filename,
    } as any);

    const response = await fetch(`${env.API_BASE_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Don't set Content-Type header - let the browser/RN set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'File upload failed');
    }

    const result = await response.json();
    
    // The API might return different formats - handle both
    if (typeof result === 'string') {
      // If it returns just the filename as a string
      return { filename: result, url: `${env.API_BASE_URL}/files/${result}` };
    } else if (result.filename || result.url) {
      // If it returns an object with filename/url
      return {
        filename: result.filename || result.name,
        url: result.url || `${env.API_BASE_URL}/files/${result.filename || result.name}`,
      };
    } else {
      // Fallback - construct URL from filename if available
      const uploadedFilename = result.name || result || filename;
      return {
        filename: uploadedFilename,
        url: `${env.API_BASE_URL}/files/${uploadedFilename}`,
      };
    }
  } catch (error) {
    console.error('File upload error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to upload file. Please try again.');
  }
}

/**
 * Gets the full URL for a file by filename
 * @param filename - The filename returned from upload
 * @returns The full URL to access the file
 */
export function getFileUrl(filename: string): string {
  return `${env.API_BASE_URL}/files/${filename}`;
}

