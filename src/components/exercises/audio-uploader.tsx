"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X, FileAudio, Loader2 } from "lucide-react";

interface AudioUploaderProps {
  onUploadComplete: (data: { url: string; key: string }) => void;
  onUploadError?: (error: string) => void;
  existingAudioUrl?: string;
  existingAudioKey?: string;
  onRemove?: () => void;
  disabled?: boolean;
}

export function AudioUploader({
  onUploadComplete,
  onUploadError,
  existingAudioUrl,
  existingAudioKey,
  onRemove,
  disabled = false,
}: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    key: string;
    name: string;
  } | null>(
    existingAudioUrl && existingAudioKey
      ? {
          url: existingAudioUrl,
          key: existingAudioKey,
          name: existingAudioKey.split("/").pop() || "audio file",
        }
      : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mp4",
      "audio/x-m4a",
      "audio/ogg",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Invalid file type. Please upload MP3, WAV, M4A, or OGG files.";
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return "File too large. Maximum size is 50MB.";
    }

    return null;
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      onUploadError?.(validationError);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setUploadProgress(100);

      setUploadedFile({
        url: data.url,
        key: data.key,
        name: file.name,
      });

      onUploadComplete({ url: data.url, key: data.key });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, onUploadComplete, onUploadError]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        uploadFile(file);
      }
    },
    [disabled, isUploading, uploadFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemove = async () => {
    if (uploadedFile) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(uploadedFile.url)}`, {
          method: "DELETE",
        });
      } catch {
        // Ignore deletion errors - file may already be gone
      }
    }
    setUploadedFile(null);
    setError(null);
    onRemove?.();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (uploadedFile) {
    return (
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
        <FileAudio className="h-8 w-8 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{uploadedFile.name}</p>
          <audio
            src={uploadedFile.url}
            controls
            className="w-full mt-2 h-8"
            preload="metadata"
          />
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging && "border-primary bg-primary/5",
          error && "border-destructive",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && !isUploading && "cursor-pointer hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled && !isUploading ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a,.ogg"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploading...</p>
              <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drop audio file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports MP3, WAV, M4A, OGG (max 50MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
