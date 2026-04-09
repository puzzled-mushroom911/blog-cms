import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from '../lib/supabase';

export default function ImageUpload({
  value,
  slug,
  onUpload,
  onRemove,
  label,
  className = "",
  previewHeight = "h-40",
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const BUCKET = "blog-images";

  const uploadFile = useCallback(
    async (file) => {
      if (!supabase) {
        setError("Supabase not configured");
        return;
      }

      // Validate type
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
      ];
      if (!allowed.includes(file.type)) {
        setError("Unsupported file type. Use JPEG, PNG, WebP, GIF, or SVG.");
        return;
      }

      // Validate size (10 MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum size is 10 MB.");
        return;
      }

      setError("");
      setUploading(true);
      setProgress(0);

      // Build storage path
      const safeSlug = slug || "unsorted";
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `posts/${safeSlug}/${timestamp}-${safeName}`;

      // Simulate progress while uploading (Supabase JS v2 doesn't expose real progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);

      try {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        clearInterval(progressInterval);

        if (uploadError) {
          throw uploadError;
        }

        setProgress(100);

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(path);

        onUpload(publicUrl);
      } catch (err) {
        clearInterval(progressInterval);
        const message =
          err instanceof Error ? err.message : "Upload failed";
        setError(message);
      } finally {
        setUploading(false);
        // Reset progress after a beat so the bar fills visually
        setTimeout(() => setProgress(0), 600);
      }
    },
    [slug, onUpload]
  );

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          {label}
        </label>
      )}

      {/* If we have an image, show preview */}
      {value && !uploading ? (
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className={`w-full ${previewHeight} object-cover rounded-lg border border-slate-200`}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-slate-700 rounded-lg text-xs font-medium shadow-sm hover:bg-slate-50"
            >
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 bg-white text-red-600 rounded-lg shadow-sm hover:bg-red-50"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2
            ${previewHeight} w-full rounded-lg border-2 border-dashed
            cursor-pointer transition-colors
            ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
            }
            ${uploading ? "pointer-events-none" : ""}
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              <span className="text-xs text-slate-500">Uploading...</span>
              {/* Progress bar */}
              <div className="w-3/4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(progress)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              {dragOver ? (
                <Upload className="w-6 h-6 text-blue-400" />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-300" />
              )}
              <span className="text-xs text-slate-400">
                {dragOver
                  ? "Drop image here"
                  : "Click or drag an image to upload"}
              </span>
              <span className="text-[10px] text-slate-300">
                JPEG, PNG, WebP, GIF -- max 10 MB
              </span>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}
    </div>
  );
}
