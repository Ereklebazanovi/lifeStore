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
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('მხოლოდ JPG, PNG და WebP ფაილები მიიღება');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('ფაილი ძალიან დიდია (მაქს. 5MB)');
      }

      // Try multiple upload presets in order
      const uploadPresets = ['stockmate_uploads', 'ml_default', 'upload_preset'];
      let uploadSuccess = false;
      let uploadData: any = null;
      let lastError: Error | null = null;

      setUploadProgress(30);

      for (const preset of uploadPresets) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', preset);

          console.log(`Trying upload preset: ${preset}`);

          const response = await fetch(
            'https://api.cloudinary.com/v1_1/domclcimy/image/upload',
            {
              method: 'POST',
              body: formData,
            }
          );

          setUploadProgress(60);

          if (response.ok) {
            uploadData = await response.json();
            uploadSuccess = true;
            console.log(`Upload successful with preset: ${preset}`);
            break;
          } else {
            let errorMessage = `Upload failed with preset ${preset}: ${response.status}`;
            try {
              const errorData = await response.json();
              if (errorData.error && errorData.error.message) {
                errorMessage = `${preset}: ${errorData.error.message}`;
              }
            } catch (e) {
              // Keep default error message if JSON parsing fails
            }
            console.warn(errorMessage);
            lastError = new Error(errorMessage);
          }
        } catch (error) {
          console.warn(`Failed with preset ${preset}:`, error);
          lastError = error as Error;
        }
      }

      if (!uploadSuccess || !uploadData) {
        throw lastError || new Error('ყველა upload preset-ი ვერ მუშაობს');
      }

      setUploadProgress(80);

      if (!uploadData.secure_url) {
        throw new Error('სურათის URL მიღება ვერ მოხერხდა');
      }

      setUploadProgress(100);

      // Return optimized URL with automatic compression and format
      const optimizedUrl = uploadData.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
      return optimizedUrl;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      if (error instanceof Error) {
        throw new Error(`სურათის ატვირთვა ვერ მოხერხდა: ${error.message}`);
      } else {
        throw new Error('სურათის ატვირთვა ვერ მოხერხდა: უცნობი შეცდომა');
      }
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