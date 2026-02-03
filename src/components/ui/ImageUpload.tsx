import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
// import { useImageUpload } from '../../hooks/useImageUpload'; // Firebase Storage - broken
import { useCloudinaryUpload as useImageUpload } from '../../hooks/useCloudinaryUpload'; // Using Cloudinary instead

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 4 // <--- შეიცვალა 4-ზე (default)
}) => {
  const [dragActive, setDragActive] = useState(false);
  const { uploading, uploadImage, uploadProgress } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      alert(`მაქსიმუმ ${maxImages} სურათი შეგიძლიათ ატვირთოთ`);
      return;
    }

    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        console.log('Starting upload for file:', file.name, 'size:', file.size, 'type:', file.type);
        const url = await uploadImage(file);
        console.log('Upload successful:', url);
        return url;
      } catch (error) {
        console.error('Upload failed for file:', file.name, 'Error:', error);
        alert(`სურათის ატვირთვა ვერ მოხერხდა (${file.name}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    const validUrls = uploadedUrls.filter(url => url !== null) as string[];

    if (validUrls.length > 0) {
      onChange([...images, ...validUrls]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };


  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        სურათები ({images.length}/{maxImages})
      </label>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> {/* შევცვალე Grid layout 4-ზე */}
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0ibTEyIDJjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMHMtNC40NzcgMTAtMTAgMTAtMTAtNC40NzctMTAtMTAgNC40NzctMTAgMTAtMTB6bTAgMThjNC40MTEgMCA4LTMuNTg5IDgtOHMtMy41ODktOC04LTgtOCAzLjU4OS04IDggMy41ODkgOCA4IDh6IiBmaWxsPSIjY2NjIi8+CjxwYXRoIGQ9Im0xMiA2Yy0xLjEwNSAwLTIgLjg5NS0yIDJ2OGMwIDEuMTA1Ljg5NSAyIDIgMnMyLS44OTUgMi0ydi04YzAtMS4xMDUtLjg5NS0yLTItMnoiIGZpbGw9IiNjY2MiLz4KPC9zdmc+';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Upload */}
      {images.length < maxImages && (
        <div>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 text-green-600 mx-auto animate-spin" />
                <p className="text-sm text-gray-600">სურათი იტვირთება...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  ჩააგდეთ სურათები აქ ან{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-green-600 hover:underline"
                  >
                    აირჩიეთ ფაილები
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP - მაქს. 5MB
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFileUpload(e.target.files);
              }
            }}
            disabled={uploading}
          />
        </div>
      )}

      {images.length >= maxImages && (
        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">მაქსიმუმ {maxImages} სურათი შეგიძლიათ ატვირთოთ</span>
        </div>
      )}
    </div>
  );
};
///////////////////////////
export default ImageUpload;