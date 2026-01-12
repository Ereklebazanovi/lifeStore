// Alternative image upload using Cloudinary
//useCloudinaryUpload.ts
import { useState } from 'react';

interface UseCloudinaryUploadReturn {
  uploading: boolean;
  uploadImage: (file: File) => Promise<string>;
  uploadProgress: number;
}

export const useCloudinaryUpload = (): UseCloudinaryUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    setUploadProgress(10);

    try {
      // Using Cloudinary unsigned upload (no API key needed for uploads)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'lifestore_uploads');

      setUploadProgress(30);

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/domclcimy/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      setUploadProgress(80);

      const data = await response.json();
      setUploadProgress(100);

      // Return optimized URL with automatic compression and format
      const optimizedUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
      return optimizedUrl;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`სურათის ატვირთვა ვერ მოხერხდა: ${(error as Error).message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploading,
    uploadImage,
    uploadProgress,
  };
};