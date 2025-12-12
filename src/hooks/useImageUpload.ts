// src/hooks/useImageUpload.ts
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../services/firebase';

interface UseImageUploadReturn {
  uploading: boolean;
  uploadImage: (file: File, folder?: string) => Promise<string>;
  deleteImage: (imageUrl: string) => Promise<void>;
  uploadProgress: number;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (file: File, folder = 'products'): Promise<string> => {
    if (!file) throw new Error('No file provided');

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, `${folder}/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      setUploadProgress(100);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathname = decodeURIComponent(url.pathname);
      const filePath = pathname.split('/o/')[1]?.split('?')[0];

      if (filePath) {
        const imageRef = ref(storage, filePath);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for delete operations
    }
  };

  return {
    uploading,
    uploadImage,
    deleteImage,
    uploadProgress
  };
};