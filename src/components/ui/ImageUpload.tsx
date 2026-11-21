import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, AlertCircle, Crop, Copy, Check, Info } from 'lucide-react';
import { useCloudinaryUpload as useImageUpload } from '../../hooks/useCloudinaryUpload';
import ImageCropperModal, { type AspectPreset } from './ImageCropperModal';
import { showToast } from './Toast';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  variant?: 'product' | 'blog' | 'category';
}

const PRODUCT_PRESETS: AspectPreset[] = [
  {
    label: '4:5 (ბარათის ზომა — რეკომენდებული)',
    aspect: 4 / 5,
    outputWidth: 800,
    outputHeight: 1000,
  },
  {
    label: '1:1 (კვადრატი)',
    aspect: 1,
    outputWidth: 1000,
    outputHeight: 1000,
  },
];

const BLOG_PRESETS: AspectPreset[] = [
  {
    label: '16:9 (ბლოგის ქავერი)',
    aspect: 16 / 9,
    outputWidth: 1200,
    outputHeight: 675,
  },
  {
    label: '3:2 (სტანდარტული)',
    aspect: 3 / 2,
    outputWidth: 1200,
    outputHeight: 800,
  },
];

const VARIANT_CONFIG = {
  product: {
    aspect: 4 / 5,
    outputWidth: 800,
    outputHeight: 1000,
    presets: PRODUCT_PRESETS,
    previewAspectClass: 'aspect-[4/5]',
    sizeBadge: '800 × 1000 px (4:5) ან 1024 × 1024 px (1:1)',
    sizeDescription:
      'საიტის კატალოგში პროდუქტის ბარათები არის 4:5 პროპორციის (ვერტიკალური), ხოლო პროდუქტის გვერდზე ჩანს სრულად.',
    gptPrompt:
      'დამიგენერირე პროდუქტის სურათი 4:5 პროპორციით (800x1000 px) ან კვადრატული (1:1, 1024x1024 px). მთავარი ნივთი მოათავსე ზუსტად ცენტრში და გარშემო ყველა მხრიდან დატოვე მინიმუმ 15% თავისუფალი ფონი, რომ ჩარჩოში ჩასმისას კიდეები არ ჩამოიჭრას.',
  },
  blog: {
    aspect: 16 / 9,
    outputWidth: 1200,
    outputHeight: 675,
    presets: BLOG_PRESETS,
    previewAspectClass: 'aspect-video',
    sizeBadge: '1200 × 675 px (16:9) ან 1536 × 1024 px',
    sizeDescription:
      'ბლოგის სტატიის მთავარი სურათი საიტზე ჩანს ჰორიზონტალურ (16:9) ფორმატში.',
    gptPrompt:
      'დამიგენერირე ჰორიზონტალური (Landscape 16:9 ან 1536x1024 px) სურათი ბლოგის სტატიისთვის. მთავარი კომპოზიცია მოათავსე ცენტრში.',
  },
  category: {
    aspect: 1,
    outputWidth: 800,
    outputHeight: 800,
    presets: [
      {
        label: '1:1 (კვადრატი)',
        aspect: 1,
        outputWidth: 800,
        outputHeight: 800,
      },
    ],
    previewAspectClass: 'aspect-square',
    sizeBadge: '800 × 800 px ან 1024 × 1024 px (1:1 კვადრატი)',
    sizeDescription:
      'მთავარ გვერდზე კატეგორიის ბარათები არის ზუსტი კვადრატი (1:1), ქვედა მხარეს წარწერით.',
    gptPrompt:
      'დამიგენერირე კვადრატული სურათი (1:1 პროპორცია, 1024x1024 px ან 800x800 px). მთავარი ნივთი მოათავსე ცენტრში და გარშემო (განსაკუთრებით ქვედა ნაწილში, სადაც წარწერა ეფარება) დატოვე თავისუფალი სივრცე, რომ კიდეები არ ჩამოიჭრას.',
  },
};

interface CropQueueItem {
  src: string;
  file?: File;
  fileName: string;
  /** If set, replaces an existing image at this index instead of appending */
  replaceIndex?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 6,
  variant = 'product',
}) => {
  const config = VARIANT_CONFIG[variant];
  const [dragActive, setDragActive] = useState(false);
  const { uploading, uploadImage, uploadProgress } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queue of images waiting to be cropped before upload
  const [cropQueue, setCropQueue] = useState<CropQueueItem[]>([]);
  const [totalQueued, setTotalQueued] = useState(0);
  const [copiedGpt, setCopiedGpt] = useState(false);

  // Accumulate URLs uploaded during a multi-file batch
  const pendingUploadedRef = useRef<string[]>([]);

  const handleCopyGptPrompt = () => {
    navigator.clipboard.writeText(config.gptPrompt);
    setCopiedGpt(true);
    showToast('ChatGPT-ის ზომის ინსტრუქცია დაკოპირდა', 'success');
    setTimeout(() => setCopiedGpt(false), 2500);
  };

  const startFileSelection = (files: FileList) => {
    if (images.length + files.length > maxImages) {
      alert(`მაქსიმუმ ${maxImages} სურათი შეგიძლიათ ატვირთოთ`);
      return;
    }

    const items: CropQueueItem[] = Array.from(files).map((file) => ({
      src: URL.createObjectURL(file),
      file,
      fileName: file.name,
    }));

    if (items.length > 0) {
      pendingUploadedRef.current = [];
      setTotalQueued(items.length);
      setCropQueue(items);
    }
  };

  const cleanupQueueItem = (item: CropQueueItem) => {
    if (item.src.startsWith('blob:')) {
      URL.revokeObjectURL(item.src);
    }
  };

  const processNextOrFinish = (remaining: CropQueueItem[], currentImages: string[]) => {
    if (remaining.length > 0) {
      setCropQueue(remaining);
    } else {
      setCropQueue([]);
      setTotalQueued(0);
      if (pendingUploadedRef.current.length > 0) {
        onChange([...currentImages, ...pendingUploadedRef.current]);
        pendingUploadedRef.current = [];
      }
    }
  };

  const uploadSingleAndAdvance = async (fileToUpload: File) => {
    const currentItem = cropQueue[0];
    if (!currentItem) return;

    const remaining = cropQueue.slice(1);
    cleanupQueueItem(currentItem);
    // Temporarily hide modal while uploading if this is the last item
    if (remaining.length === 0) {
      setCropQueue([]);
    }

    try {
      const url = await uploadImage(fileToUpload);

      if (currentItem.replaceIndex !== undefined) {
        const updated = [...images];
        updated[currentItem.replaceIndex] = url;
        onChange(updated);
        showToast('სურათი განახლდა', 'success');
        setCropQueue([]);
        setTotalQueued(0);
        return;
      }

      pendingUploadedRef.current.push(url);
      processNextOrFinish(remaining, images);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(
        `სურათის ატვირთვა ვერ მოხერხდა (${fileToUpload.name}): ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      processNextOrFinish(remaining, images);
    }
  };

  const handleSkipCrop = async () => {
    const currentItem = cropQueue[0];
    if (!currentItem) return;

    if (currentItem.file) {
      await uploadSingleAndAdvance(currentItem.file);
    } else {
      // It was an existing remote URL opened for re-cropping, so just close
      setCropQueue([]);
      setTotalQueued(0);
    }
  };

  const handleCloseCropper = () => {
    cropQueue.forEach(cleanupQueueItem);
    setCropQueue([]);
    setTotalQueued(0);
    if (pendingUploadedRef.current.length > 0) {
      onChange([...images, ...pendingUploadedRef.current]);
      pendingUploadedRef.current = [];
    }
  };

  const handleRecropExisting = (index: number) => {
    const existingUrl = images[index];
    if (!existingUrl) return;
    pendingUploadedRef.current = [];
    setTotalQueued(1);
    setCropQueue([
      {
        src: existingUrl,
        fileName: `image-${index + 1}.jpg`,
        replaceIndex: index,
      },
    ]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      startFileSelection(files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const currentCropItem = cropQueue[0];
  const currentStepIndex = totalQueued - cropQueue.length + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">
          სურათები ({images.length}/{maxImages})
        </label>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
          რეკომენდებული ზომა: {config.sizeBadge}
        </span>
      </div>

      {/* Recommended dimensions & ChatGPT prompt helper box */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-stone-700 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-900">
                იდეალური ზომა: <span className="text-emerald-700">{config.sizeBadge}</span>
              </p>
              <p className="text-stone-600 mt-0.5 leading-relaxed">{config.sizeDescription}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyGptPrompt}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-amber-100/60 text-stone-800 border border-amber-300 rounded-lg font-semibold transition-colors shadow-2xs"
            title="დააკოპირეთ ტექსტი ChatGPT-სთვის მისაწერად"
          >
            {copiedGpt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">დაკოპირდა!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-700" />
                <span>GPT ზომის კოპირება</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div
                className={`${config.previewAspectClass} rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-2xs`}
              >
                <img
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0ibTEyIDJjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMHMtNC40NzcgMTAtMTAgMTAtMTAtNC40NzctMTAtMTAgNC40NzctMTAgMTAtMTB6bTAgMThjNC40MTEgMCA4LTMuNTg5IDgtOHMtMy41ODktOC04LTgtOCAzLjU4OS04IDggMy41ODkgOCA4IDh6IiBmaWxsPSIjY2NjIi8+CjxwYXRoIGQ9Im0xMiA2Yy0xLjEwNSAwLTIgLjg5NS0yIDJ2OGMwIDEuMTA1Ljg5NSAyIDIgMnMyLS44OTUgMi0ydi04YzAtMS4xMDUtLjg5NS0yLTItMnoiIGZpbGw9IiNjY2MiLz4KPC9zdmc+';
                  }}
                />
              </div>

              {/* Action buttons: Re-crop & Delete */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleRecropExisting(index)}
                  disabled={uploading}
                  title="სურათის მოჭრა / გასწორება"
                  className="bg-white/95 hover:bg-blue-600 text-gray-800 hover:text-white rounded-lg px-2 py-1 text-[11px] font-semibold shadow-md flex items-center gap-1 transition-colors"
                >
                  <Crop className="w-3 h-3" />
                  <span>მოჭრა</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={uploading}
                  title="წაშლა"
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 shadow-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="absolute bottom-2 left-2 bg-black/65 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                {index === 0 && maxImages > 1 ? '1 • მთავარი' : index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Upload Dropzone */}
      {images.length < maxImages && (
        <div>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
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
                    className="text-green-600 font-semibold hover:underline"
                  >
                    აირჩიეთ ფაილები
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP — მაქს. 5MB • არჩევის შემდეგ შეძლებთ ჩარჩოში გასწორებას და მოჭრას
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple={maxImages > 1}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                startFileSelection(e.target.files);
                e.target.value = '';
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

      {/* Facebook-style Image Cropper Modal */}
      {currentCropItem && (
        <ImageCropperModal
          isOpen={true}
          imageSrc={currentCropItem.src}
          fileName={currentCropItem.fileName}
          aspect={config.aspect}
          outputWidth={config.outputWidth}
          outputHeight={config.outputHeight}
          presets={config.presets}
          queueLabel={
            totalQueued > 1 ? `${currentStepIndex} / ${totalQueued}` : undefined
          }
          onClose={handleCloseCropper}
          onCropComplete={uploadSingleAndAdvance}
          onSkipCrop={currentCropItem.file ? handleSkipCrop : undefined}
        />
      )}
    </div>
  );
};

export default ImageUpload;
