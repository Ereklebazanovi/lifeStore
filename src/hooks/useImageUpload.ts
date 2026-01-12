// src/hooks/useImageUpload.ts
import { useState } from "react";
import {
  ref,
  uploadBytesResumable,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getStorage,
} from "firebase/storage";
import { storage, auth } from "../services/firebase";
import app from "../services/firebase";

interface UseImageUploadReturn {
  uploading: boolean;
  uploadImage: (file: File, folder?: string) => Promise<string>;
  deleteImage: (imageUrl: string) => Promise<void>;
  uploadProgress: number;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (
    file: File,
    folder = "products"
  ): Promise<string> => {
    if (!file) throw new Error("No file provided");

    // Check authentication first
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error(
        "მომხმარებელი არ არის ავტორიზებული. გთხოვთ შედით სისტემაში."
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("მხარდაჭერილია მხოლოდ JPEG, PNG და WebP ფორმატები.");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error("ფაილის ზომა ძალიან დიდია. მაქსიმუმ 5MB.");
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split(".").pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;

      // Create storage reference with explicit bucket path
      const bucketName = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
      const explicitStorage = getStorage(app, `gs://${bucketName}`);
      const storageRef = ref(explicitStorage, `${folder}/${fileName}`);

      // Check if user is still authenticated before upload
      if (!auth.currentUser) {
        throw new Error(
          "ავტორიზაციის შეცდომა. გთხოვთ თავიდან შედით სისტემაში."
        );
      }

      // Get user token to check permissions
      const token = await auth.currentUser.getIdToken(true);
      console.log("🔑 User token acquired, length:", token.length);

      console.log("🔥 Starting upload:", {
        fileName,
        folder,
        fullPath: `${folder}/${fileName}`,
        fileSize: file.size,
        fileType: file.type,
        storageBucket: storage.app.options.storageBucket,
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
      });

      // Upload file with metadata
      setUploadProgress(25);
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: auth.currentUser.uid,
          uploadedAt: new Date().toISOString(),
        },
      };

      console.log("📤 Uploading to Firebase Storage with metadata:", metadata);

      // Try basic uploadBytes first for testing
      console.log("📤 Attempting basic upload without metadata...");

      // First test with basic uploadBytes (no metadata, no resumable)
      try {
        console.log("🧪 Testing basic Firebase Storage access...");
        const basicSnapshot = await uploadBytes(storageRef, file);
        console.log("✅ Basic upload successful:", basicSnapshot);

        setUploadProgress(75);
        const downloadURL = await getDownloadURL(basicSnapshot.ref);
        console.log("✅ Download URL obtained:", downloadURL);

        setUploadProgress(100);
        return downloadURL;
      } catch (basicError) {
        console.log("❌ Basic upload failed, trying resumable...", basicError);
      }

      // If basic fails, try resumable upload
      const uploadPromise = uploadBytesResumable(storageRef, file, metadata);

      // Set a shorter timeout to fail fast
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Upload timeout - მოხდა კავშირის პრობლემა")),
          15000
        )
      );

      let snapshot;
      try {
        snapshot = await Promise.race([
          new Promise((resolve, reject) => {
            uploadPromise.on(
              "state_changed",
              (snapshot) => {
                const progress =
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 50 + 25;
                setUploadProgress(progress);
                console.log(`📊 Upload progress: ${Math.round(progress)}%`);
              },
              (error) => {
                console.error("❌ Upload error:", error);
                reject(error);
              },
              () => {
                console.log("✅ Upload completed successfully");
                resolve(uploadPromise.snapshot);
              }
            );
          }),
          timeoutPromise,
        ]);

        console.log("✅ Upload successful:", snapshot);
      } catch (firebaseError) {
        console.error(
          "❌ Firebase Storage failed, trying REST API...",
          firebaseError
        );

        // Try REST API approach
        try {
          console.log("🌐 Attempting REST API upload...");
          setUploadProgress(30);

          const restUrl = `https://firebasestorage.googleapis.com/v0/b/${
            storage.app.options.storageBucket
          }/o?uploadType=media&name=${encodeURIComponent(
            `${folder}/${fileName}`
          )}`;

          const response = await fetch(restUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": file.type,
            },
            body: file,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ REST API error:", response.status, errorText);
            throw new Error(`REST API upload failed: ${response.status}`);
          }

          const result = await response.json();
          console.log("✅ REST API upload successful:", result);

          setUploadProgress(75);

          // Get download URL via REST API
          const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${
            storage.app.options.storageBucket
          }/o/${encodeURIComponent(`${folder}/${fileName}`)}?alt=media`;

          setUploadProgress(100);
          setUploading(false);
          return downloadUrl;
        } catch (restError) {
          console.error("❌ REST API also failed:", restError);
          throw new Error(
            `სურათის ატვირთვა ვერ მოხერხდა - ყველა მეთოდი ჩავარდა: ${firebaseError.message}`
          );
        }
      }

      setUploadProgress(75);

      // Get download URL (only if Firebase Storage succeeded)
      console.log("🔗 Getting download URL...");
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("✅ Download URL obtained:", downloadURL);

      setUploadProgress(100);
      return downloadURL;
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      console.error("❌ Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        serverResponse: (error as any)?.serverResponse,
        customData: (error as any)?.customData,
      });

      // Detailed error handling
      const errorCode = (error as any)?.code;
      const errorMessage = (error as any)?.message || "";

      if (errorCode === "storage/unauthorized") {
        throw new Error(
          "ავტორიზაციის შეცდომა. შეამოწმეთ Firebase Storage rules."
        );
      } else if (errorCode === "storage/quota-exceeded") {
        throw new Error("შენახვის ლიმიტი ამოწურულია.");
      } else if (errorCode === "storage/unauthenticated") {
        throw new Error("გთხოვთ შედით სისტემაში სურათის ასატვირთად.");
      } else if (errorCode === "storage/unknown") {
        throw new Error(`Firebase Storage უცნობი შეცდომა: ${errorMessage}`);
      } else if (errorMessage.includes("CORS")) {
        throw new Error(
          "CORS შეცდომა. Firebase Storage-ის კონფიგურაცია საჭიროებს განახლებას."
        );
      } else {
        throw new Error(
          `სურათის ატვირთვა ვერ მოხერხდა: ${
            errorCode || "უცნობი შეცდომა"
          } - ${errorMessage}`
        );
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
      const filePath = pathname.split("/o/")[1]?.split("?")[0];

      if (filePath) {
        const imageRef = ref(storage, filePath);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      // Don't throw error for delete operations
    }
  };

  return {
    uploading,
    uploadImage,
    deleteImage,
    uploadProgress,
  };
};
