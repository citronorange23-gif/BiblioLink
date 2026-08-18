"use client";

import { useState } from "react";

type BookCoverProps = {
  src: string | null;
  alt: string;
  emptyClassName?: string;
};

export default function BookCover({
  src,
  alt,
  emptyClassName = "text-6xl",
}: BookCoverProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!src) {
    return <span className={emptyClassName}>📖</span>;
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}