import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Check,
  Move,
  Maximize2,
  Minimize2,
  Eye,
  Upload,
} from "lucide-react";

export interface AspectPreset {
  label: string;
  aspect: number; // width / height
  outputWidth: number;
  outputHeight: number;
  description?: string;
}

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string; // Object URL, data URL, or remote URL
  fileName?: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  onSkipCrop?: () => void;
  aspect?: number; // default width / height, e.g. 1 for 1:1, 0.8 for 4:5, 16/9 for blog
  outputWidth?: number;
  outputHeight?: number;
  title?: string;
  subtitle?: string;
  /** Optional presets if the user can switch aspect ratios */
  presets?: AspectPreset[];
  /** Show live category card overlay preview (gradient + title at bottom) */
  categoryPreviewTitle?: string;
  /** Step indicator when cropping multiple files (e.g. "1 / 3") */
  queueLabel?: string;
}

const BG_COLORS = [
  { label: "თეთრი", value: "#ffffff", ring: "ring-gray-300" },
  { label: "კრემისფერი", value: "#f5f5f4", ring: "ring-stone-300" },
  { label: "მუქი", value: "#1c1917", ring: "ring-stone-800" },
];

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  fileName = "cropped-image.jpg",
  onClose,
  onCropComplete,
  onSkipCrop,
  aspect: initialAspect = 1,
  outputWidth: initialOutW = 800,
  outputHeight: initialOutH = 800,
  title = "სურათის მორგება და მოჭრა",
  subtitle = "გადაადგილეთ სურათი მაუსით ან თითით სასურველ პოზიციაზე",
  presets,
  categoryPreviewTitle,
  queueLabel,
}) => {
  const [activeAspect, setActiveAspect] = useState(initialAspect);
  const [outW, setOutW] = useState(initialOutW);
  const [outH, setOutH] = useState(initialOutH);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [bgColor, setBgColor] = useState("#ffffff");
  const [isDragging, setIsDragging] = useState(false);
  const [showCategoryOverlay, setShowCategoryOverlay] = useState(!!categoryPreviewTitle);
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number }>({
    x: 0,
    y: 0,
    ox: 0,
    oy: 0,
  });

  // Sync initial props when opened with a new image
  useEffect(() => {
    if (isOpen) {
      setActiveAspect(initialAspect);
      setOutW(initialOutW);
      setOutH(initialOutH);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
      setLoadError(false);
      setShowCategoryOverlay(!!categoryPreviewTitle);
    }
  }, [isOpen, imageSrc, initialAspect, initialOutW, initialOutH, categoryPreviewTitle]);

  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>({
    w: typeof window !== "undefined" ? window.innerWidth : 1024,
    h: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  // Compute crop box size in screen pixels based on activeAspect
  // Guarantees exact aspect ratio without flexbox squashing
  const getCropBoxSize = useCallback(() => {
    const maxW = Math.min(viewportSize.w - 64, 340);
    const maxH = Math.min(Math.max(viewportSize.h - 330, 240), 340);
    let boxW = maxW;
    let boxH = boxW / activeAspect;
    if (boxH > maxH) {
      boxH = maxH;
      boxW = boxH * activeAspect;
    }
    const finalW = Math.round(boxW);
    const finalH = Math.round(finalW / activeAspect);
    return { boxW: finalW, boxH: finalH };
  }, [activeAspect, viewportSize]);

  const { boxW, boxH } = getCropBoxSize();

  const isRotated90 = rotation % 180 !== 0;
  const effW = isRotated90 ? naturalSize.h : naturalSize.w;
  const effH = isRotated90 ? naturalSize.w : naturalSize.h;

  // Base scale at zoom = 1 so that the image covers the crop box
  const baseScale =
    effW > 0 && effH > 0 ? Math.max(boxW / effW, boxH / effH) : 1;

  // Minimum zoom that fits the entire image inside the box without cropping
  const fitZoom =
    effW > 0 && effH > 0
      ? Math.min(boxW / (effW * baseScale), boxH / (effH * baseScale))
      : 1;

  const minZoom = Math.min(0.5, +(fitZoom * 0.9).toFixed(2));
  const maxZoom = 3;

  const clampOffset = useCallback(
    (ox: number, oy: number, currentZoom: number, currentRot: number) => {
      if (naturalSize.w === 0 || naturalSize.h === 0) return { x: 0, y: 0 };
      const rot90 = currentRot % 180 !== 0;
      const ew = rot90 ? naturalSize.h : naturalSize.w;
      const eh = rot90 ? naturalSize.w : naturalSize.h;
      const bScale = Math.max(boxW / ew, boxH / eh);
      const dispW = ew * bScale * currentZoom;
      const dispH = eh * bScale * currentZoom;

      const maxX = Math.abs(dispW - boxW) / 2;
      const maxY = Math.abs(dispH - boxH) / 2;

      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      };
    },
    [naturalSize, boxW, boxH]
  );

  // Re-clamp whenever zoom, rotation, or aspect changes
  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, rotation));
  }, [zoom, rotation, activeAspect, clampOffset]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setImageLoaded(true);
    setLoadError(false);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageLoaded) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset(
      clampOffset(
        dragStartRef.current.ox + dx,
        dragStartRef.current.oy + dy,
        zoom,
        rotation
      )
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((z) => {
      const next = Math.max(minZoom, Math.min(maxZoom, +(z + delta).toFixed(2)));
      return next;
    });
  };

  const handleFitEntireImage = () => {
    setZoom(+(fitZoom).toFixed(2));
    setOffset({ x: 0, y: 0 });
  };

  const handleFillFrame = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
    setOffset({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirmCrop = async () => {
    if (!imgRef.current || !imageLoaded) return;
    setProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context unavailable");
      }

      // Fill background (visible when zoomed out < 1 or transparent PNG)
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, outW, outH);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const ratio = outW / boxW;
      const screenScale = baseScale * zoom;
      const canvasScale = screenScale * ratio;
      const rotRad = (rotation * Math.PI) / 180;

      ctx.save();
      ctx.translate(outW / 2 + offset.x * ratio, outH / 2 + offset.y * ratio);
      ctx.rotate(rotRad);
      ctx.scale(canvasScale, canvasScale);
      ctx.drawImage(
        imgRef.current,
        -naturalSize.w / 2,
        -naturalSize.h / 2,
        naturalSize.w,
        naturalSize.h
      );
      ctx.restore();

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("სურათის დამუშავება ვერ მოხერხდა"));
          },
          "image/jpeg",
          0.92
        );
      });

      const cleanName = fileName.replace(/\.[^/.]+$/, "") + "-cropped.jpg";
      const croppedFile = new File([blob], cleanName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      onCropComplete(croppedFile);
    } catch (err) {
      console.error("Crop error:", err);
      alert("სურათის მოჭრა ვერ მოხერხდა. სცადეთ პირდაპირ ატვირთვა.");
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-y-auto flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              {queueLabel && (
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {queueLabel}
                </span>
              )}
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                {outW} × {outH} px
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Bar (if provided) */}
        {presets && presets.length > 1 && (
          <div className="px-5 py-2.5 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-medium text-gray-500 shrink-0">ფორმატი:</span>
            {presets.map((p) => {
              const isSelected = Math.abs(activeAspect - p.aspect) < 0.01;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setActiveAspect(p.aspect);
                    setOutW(p.outputWidth);
                    setOutH(p.outputHeight);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {p.label} ({p.outputWidth}×{p.outputHeight})
                </button>
              );
            })}
          </div>
        )}

        {/* Interactive Crop Viewport (Facebook Profile/Cover style) */}
        <div
          className="relative bg-stone-900 flex flex-col items-center justify-center py-5 px-4 select-none overflow-hidden shrink-0"
          onWheel={handleWheel}
        >
          {/* Floating instruction badge */}
          <div className="mb-2.5 flex items-center gap-2 bg-black/60 text-white/90 text-xs px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none shrink-0">
            <Move className="w-3.5 h-3.5 text-emerald-400" />
            <span>დააჭირეთ და გადაადგილეთ სურათი ჩარჩოში</span>
          </div>

          {/* The Cutout Frame — shrink-0 ensures 1:1 stays strictly square */}
          <div
            ref={stageRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: `${boxW}px`,
              height: `${boxH}px`,
              minWidth: `${boxW}px`,
              minHeight: `${boxH}px`,
              backgroundColor: bgColor,
              touchAction: "none",
            }}
            className={`relative shrink-0 overflow-hidden rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ring-2 ring-white/90 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {loadError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-red-300 text-xs">
                სურათის ჩატვირთვა ვერ მოხერხდა
              </div>
            ) : (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                crossOrigin="anonymous"
                onLoad={handleImageLoad}
                onError={() => setLoadError(true)}
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: naturalSize.w ? `${naturalSize.w}px` : "auto",
                  height: naturalSize.h ? `${naturalSize.h}px` : "auto",
                  maxWidth: "none",
                  maxHeight: "none",
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${
                    baseScale * zoom
                  })`,
                  transformOrigin: "center center",
                  opacity: imageLoaded ? 1 : 0,
                  transition: isDragging ? "none" : "transform 0.08s ease-out",
                }}
                className="pointer-events-none select-none"
              />
            )}

            {/* Rule of thirds grid overlay (visible while dragging or adjusting) */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
                isDragging ? "opacity-80" : "opacity-25"
              }`}
            >
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, idx) => (
                  <div key={idx} className="border border-white/40" />
                ))}
              </div>
            </div>

            {/* Exact CategoryGrid.tsx Live Overlay (matches Home Page 1:1 card layout) */}
            {showCategoryOverlay && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 flex flex-col justify-end p-4 pointer-events-none">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                      {categoryPreviewTitle || "კატეგორიის სახელი"}
                    </h3>
                    {/* Exact 20px spacer matching the opacity-0 'გადასვლა ->' row in CategoryGrid.tsx */}
                    <div className="h-5" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Original vs Target Dimension info */}
          {imageLoaded && (
            <div className="mt-3 flex items-center gap-3 text-[11px] text-stone-300">
              <span>
                ორიგინალი: <strong className="text-white">{naturalSize.w} × {naturalSize.h} px</strong>
              </span>
              <span>•</span>
              <span>
                საბოლოო ზომა: <strong className="text-emerald-400">{outW} × {outH} px</strong>
              </span>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="px-5 py-4 bg-white border-t border-gray-200 space-y-3.5">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(minZoom, +(z - 0.1).toFixed(2)))}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="დაპატარავება"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(maxZoom, +(z + 0.1).toFixed(2)))}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="გადიდება"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold text-gray-600 w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Action Buttons: Fit / Fill / Rotate / Reset / Background color */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleFillFrame}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  Math.abs(zoom - 1) < 0.03
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
                title="ჩარჩოს სრულად შევსება"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                შევსება
              </button>

              <button
                type="button"
                onClick={handleFitEntireImage}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  Math.abs(zoom - fitZoom) < 0.03 && fitZoom < 0.99
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
                title="მთლიანი სურათის ჩატევა ჩარჩოში ჩამოჭრის გარეშე"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                სრულად ჩატევა
              </button>

              <button
                type="button"
                onClick={handleRotate}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                title="90°-ით შემოტრიალება"
              >
                <RotateCw className="w-3.5 h-3.5" />
                90°
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                title="საწყის პოზიციაზე დაბრუნება"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {categoryPreviewTitle !== undefined && (
                <button
                  type="button"
                  onClick={() => setShowCategoryOverlay((v) => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    showCategoryOverlay
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                  title="საიტის წარწერის ჩვენება/დამალვა"
                >
                  <Eye className="w-3.5 h-3.5" />
                  წარწერა
                </button>
              )}
            </div>

            {/* Background color selector (useful when zoomed out / fitting) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500">ფონი:</span>
              {BG_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setBgColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  title={`ფონის ფერი: ${c.label}`}
                  className={`w-5 h-5 rounded-full border border-gray-300 transition-transform ${
                    bgColor === c.value ? `scale-110 ring-2 ${c.ring}` : "opacity-75 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              გაუქმება
            </button>

            <div className="flex items-center gap-2">
              {onSkipCrop && (
                <button
                  type="button"
                  onClick={onSkipCrop}
                  disabled={processing}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 transition-colors"
                  title="ატვირთვა მოჭრის გარეშე (ორიგინალი ზომით)"
                >
                  <Upload className="w-3.5 h-3.5" />
                  ორიგინალის ატვირთვა
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={processing || !imageLoaded}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                {processing ? "მუშავდება..." : "დადასტურება და ატვირთვა"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
