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

    // Normalize various possible response shapes into a string filename and/or url
    const pickString = (...vals: unknown[]): string | undefined => {
      for (const v of vals) {
        if (typeof v === 'string' && v.trim().length > 0) return v;
      }
      return undefined;
    };

    const extractFromObject = (obj: any): { filename?: string; url?: string } => {
      if (!obj || typeof obj !== 'object') return {};
      // Common fields
      const url = pickString(obj.url);
      const direct = pickString(obj.filename, obj.name, obj.fileName, obj.path);
      // Nested possibilities (some uploaders wrap payload)
      const nested = typeof obj.filename === 'object' ? extractFromObject(obj.filename) : {};
      return {
        url: url || nested.url,
        filename: direct || nested.filename,
      };
    };

    let normalized: { filename?: string; url?: string } = {};

    if (typeof result === 'string') {
      normalized = { filename: result };
    } else if (Array.isArray(result)) {
      // Take first valid entry
      for (const item of result) {
        const ex = extractFromObject(item);
        if (ex.url || ex.filename) { normalized = ex; break; }
      }
    } else if (typeof result === 'object') {
      normalized = extractFromObject(result);
    }

    const finalFilename = (() => {
      // Derive filename from provided fields or from url path
      const fromDirect = pickString(normalized.filename, filename);
      if (fromDirect) return fromDirect;
      const u = pickString(normalized.url);
      if (u) {
        try { return new URL(u).pathname.split('/').pop() || filename; } catch { /* ignore */ }
      }
      return filename;
    })();

    let finalUrl = pickString(normalized.url);
    // Normalize bad hosts (e.g., localhost) to API_BASE_URL
    if (!finalUrl || /localhost|127\.0\.0\.1/i.test(finalUrl)) {
      finalUrl = finalFilename ? `${env.API_BASE_URL}/files/${finalFilename}` : undefined;
    }

    if (!finalFilename && !finalUrl) {
      throw new Error('Upload succeeded but no filename/url was returned');
    }

    return {
      filename: finalFilename || filename,
      url: finalUrl,
    };
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

