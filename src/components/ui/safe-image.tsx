"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  category?: string;
}

const DEFAULT_FALLBACK = "/images/blog-fallback.svg";
const CATEGORY_FALLBACKS: Record<string, string> = {
  "Data Analysis": "/images/data-analysis-fallback.svg",
  "Academic Writing": "/images/blog-fallback.svg",
  "Urgent Orders": "/images/blog-fallback.svg",
  "Freelancing": "/images/blog-fallback.svg",
  "Referencing": "/images/blog-fallback.svg",
};

export function SafeImage({
  src,
  alt,
  fallbackSrc,
  category,
  className = "",
  ...rest
}: SafeImageProps) {
  const defaultFallback =
    fallbackSrc ||
    (category && CATEGORY_FALLBACKS[category]) ||
    DEFAULT_FALLBACK;

  const [imgSrc, setImgSrc] = useState<string>(
    typeof src === "string" ? src : defaultFallback
  );
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof src === "string" && src) {
      setImgSrc(src);
      setHasError(false);
      setIsLoading(true);
    }
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(defaultFallback);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-muted/60 animate-pulse z-0" />
      )}
      <Image
        {...rest}
        src={imgSrc || defaultFallback}
        alt={alt || "TaskLynk Academic Content"}
        className={`${className} transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onError={handleError}
        onLoad={() => setIsLoading(false)}
        unoptimized={
          hasError ||
          (typeof imgSrc === "string" && imgSrc.endsWith(".svg"))
        }
      />
    </div>
  );
}
