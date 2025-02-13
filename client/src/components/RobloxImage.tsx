import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface RobloxImageProps {
  assetId: string;
  alt: string;
  size?: number;
}

export function RobloxImage({ assetId, alt }: RobloxImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full absolute" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground">Изображение недоступно</span>
        </div>
      ) : (
        <img
          src={`/api/roblox-image/${assetId}`}
          alt={alt}
          className="h-full w-full object-contain"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}