// src/hooks/useImageUploadFallback.ts
import { useState } from 'react';

interface UseImageUploadFallbackReturn {
  uploading: boolean;
  uploadImage: (file: File) => Promise<string>;
  uploadProgress: number;
}

export const useImageUploadFallback = (): UseImageUploadFallbackReturn => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadToImgur = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://api.imgur.com/3/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Client-ID 546c25a59c58ad7' // Public Imgur client ID
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Imgur upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.link;
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // Use a generic preset

    const response = await fetch(
      'https://api.cloudinary.com/v1_1/demo/image/upload', // Demo cloud name
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!file) throw new Error('No file provided');

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
    }

    // Validate file size (max 5MB for external services)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(25);

      // Try multiple upload methods
      const uploadMethods = [
        { name: 'Imgur', method: uploadToImgur },
        { name: 'Base64', method: convertToBase64 }
      ];

      setUploadProgress(50);

      for (const { name, method } of uploadMethods) {
        try {
          console.log(`Trying upload via ${name}...`);
          const url = await method(file);
          setUploadProgress(100);
          console.log(`✅ Upload successful via ${name}:`, url);
          return url;
        } catch (error) {
          console.error(`❌ Upload failed via ${name}:`, error);
          // Continue to next method
        }
      }

      throw new Error('ყველა ალტერნატიული ატვირთვის მეთოდი ვერ მუშაობს');

    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploading,
    uploadImage,
    uploadProgress
  };
};