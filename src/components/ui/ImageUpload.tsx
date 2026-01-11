import React, { useState, useRef } from 'react';
import { Upload, X, Link, Loader2, AlertCircle } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useImageUploadFallback } from '../../hooks/useImageUploadFallback';

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
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [useFirebase, setUseFirebase] = useState(true);
  const { uploading: fbUploading, uploadImage: fbUploadImage, uploadProgress: fbProgress } = useImageUpload();
  const { uploading: fallbackUploading, uploadImage: fallbackUploadImage, uploadProgress: fallbackProgress } = useImageUploadFallback();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use fallback if Firebase fails
  const uploading = useFirebase ? fbUploading : fallbackUploading;
  const uploadProgress = useFirebase ? fbProgress : fallbackProgress;
  const uploadImage = useFirebase ? fbUploadImage : fallbackUploadImage;

  const handleFileUpload = async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      alert(`მაქსიმუმ ${maxImages} სურათი შეგიძლიათ ატვირთოთ`);
      return;
    }

    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        // First try Firebase
        const url = await uploadImage(file);
        return url;
      } catch (error) {
        console.error('Upload failed with Firebase, trying fallback:', error);

        // If Firebase fails, try fallback method automatically
        if (useFirebase) {
          setUseFirebase(false);
          try {
            const url = await fallbackUploadImage(file);
            console.log('✅ Fallback upload successful');
            return url;
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            alert(`სურათის ატვირთვა ვერ მოხერხდა: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
            return null;
          }
        } else {
          alert(`სურათის ატვირთვა ვერ მოხერხდა: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return null;
        }
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

  const handleUrlAdd = () => {
    if (urlInput.trim() && images.length < maxImages) {
      try {
        new URL(urlInput);
        onChange([...images, urlInput.trim()]);
        setUrlInput('');
      } catch {
        alert('გთხოვთ შეიყვანოთ სწორი URL');
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="block text-sm font-medium text-gray-700">
          სურათები ({images.length}/{maxImages})
        </label>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setUploadMethod('file')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              uploadMethod === 'file'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-1" />
            ატვირთვა
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod('url')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              uploadMethod === 'url'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Link className="w-4 h-4 inline mr-1" />
            ლინკი
          </button>
        </div>

        {/* Upload Service Selector */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500">სერვისი:</span>
          <button
            type="button"
            onClick={() => setUseFirebase(true)}
            className={`px-2 py-1 rounded text-xs ${
              useFirebase
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Firebase
          </button>
          <button
            type="button"
            onClick={() => setUseFirebase(false)}
            className={`px-2 py-1 rounded text-xs ${
              !useFirebase
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Backup
          </button>
        </div>
      </div>

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

      {/* Upload Methods */}
      {images.length < maxImages && (
        <div className="space-y-4">
          {uploadMethod === 'file' ? (
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
          ) : (
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                onClick={handleUrlAdd}
                disabled={!urlInput.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                დამატება
              </button>
            </div>
          )}
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

export default ImageUpload;