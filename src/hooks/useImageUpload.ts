// src/hooks/useImageUpload.ts
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../services/firebase';

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

    // Check authentication first
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('მომხმარებელი არ არის ავტორიზებული. გთხოვთ შედით სისტემაში.');
    }

    // Log user info for debugging
    console.log('Current user:', {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified
    });

    // Get current auth token for debugging
    try {
      const token = await currentUser.getIdToken();
      console.log('Auth token obtained successfully');
    } catch (tokenError) {
      console.error('Error getting auth token:', tokenError);
      throw new Error('ავტორიზაციის ტოკენის მიღება ვერ მოხერხდა');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;

      // Try different folder structures to debug
      const possiblePaths = [
        `${folder}/${fileName}`,
        `images/${fileName}`,
        `uploads/${fileName}`,
        fileName // root level for testing
      ];

      console.log('Attempting upload with the following details:', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        folder,
        possiblePaths,
        storageBucket: storage.app.options.storageBucket
      });

      // Try first path
      let storageRef = ref(storage, possiblePaths[0]);

      console.log('Storage ref created:', storageRef.fullPath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload completed successfully:', snapshot);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);

      setUploadProgress(100);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      console.error('Upload error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        name: (error as any)?.name,
        stack: (error as any)?.stack,
        serverResponse: (error as any)?.serverResponse,
        customData: (error as any)?.customData
      });

      // Try to provide more specific error messages
      const errorCode = (error as any)?.code;
      switch (errorCode) {
        case 'storage/unauthorized':
          throw new Error('ავტორიზაციის შეცდომა. შეამოწმეთ Firebase Storage rules.');
        case 'storage/quota-exceeded':
          throw new Error('შენახვის ლიმიტი ამოწურულია.');
        case 'storage/unauthenticated':
          throw new Error('გთხოვთ შედით სისტემაში სურათის ასატვირთად.');
        case 'storage/unknown':
          throw new Error('Firebase Storage-ის უცნობი შეცდომა. შეამოწმეთ Firebase კონფიგურაცია.');
        case 'storage/retry-limit-exceeded':
          throw new Error('ატვირთვის მცდელობების ლიმიტი ამოწურულია.');
        case 'storage/invalid-format':
          throw new Error('ფაილის ფორმატი არასწორია.');
        default:
          throw new Error(`სურათის ატვირთვა ვერ მოხერხდა: ${error instanceof Error ? error.message : 'უცნობი შეცდომა'} (კოდი: ${errorCode || 'უცნობი'})`);
      }
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