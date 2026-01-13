"use client";

import { useMemo } from "react";

interface VideoEmbedProps {
  url: string;
  className?: string;
}

// Extract YouTube video ID from various URL formats
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract Instagram post/reel ID from URL
function getInstagramId(url: string): string | null {
  const pattern = /instagram\.com\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

// Detect video platform
function detectPlatform(url: string): "youtube" | "instagram" | null {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }
  if (url.includes("instagram.com")) {
    return "instagram";
  }
  return null;
}

export function VideoEmbed({ url, className = "" }: VideoEmbedProps) {
  const embedData = useMemo(() => {
    const platform = detectPlatform(url);

    if (platform === "youtube") {
      const videoId = getYouTubeId(url);
      if (videoId) {
        return {
          platform: "youtube",
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          videoId,
        };
      }
    }

    if (platform === "instagram") {
      const postId = getInstagramId(url);
      if (postId) {
        return {
          platform: "instagram",
          embedUrl: `https://www.instagram.com/p/${postId}/embed`,
          postId,
        };
      }
    }

    return null;
  }, [url]);

  if (!embedData) {
    return (
      <div className={`rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground ${className}`}>
        <p>Unable to embed video. Supported platforms: YouTube, Instagram</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline mt-2 inline-block"
        >
          Open video in new tab →
        </a>
      </div>
    );
  }

  if (embedData.platform === "youtube") {
    return (
      <div className={`relative w-full overflow-hidden rounded-lg ${className}`}>
        <div className="relative pb-[56.25%]">
          <iframe
            src={embedData.embedUrl}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    );
  }

  if (embedData.platform === "instagram") {
    return (
      <div className={`relative w-full overflow-hidden rounded-lg ${className}`}>
        <iframe
          src={embedData.embedUrl}
          title="Instagram post"
          allowFullScreen
          className="w-full min-h-[500px] border-0"
        />
      </div>
    );
  }

  return null;
}

// Preview component for the profile form
export function VideoPreview({ url }: { url: string }) {
  if (!url) return null;

  const platform = detectPlatform(url);
  const isValid =
    (platform === "youtube" && getYouTubeId(url)) ||
    (platform === "instagram" && getInstagramId(url));

  if (!isValid) {
    return (
      <div className="mt-2 text-sm text-amber-600">
        ⚠️ URL not recognized. Make sure it&apos;s a valid YouTube or Instagram video URL.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-muted-foreground mb-2">Preview:</p>
      <VideoEmbed url={url} />
    </div>
  );
}
