import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LikeButtonProps {
  itemId: number;
  initialLikesCount: number;
}

export function LikeButton({ itemId, initialLikesCount }: LikeButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [likesCount, setLikesCount] = useState(initialLikesCount);

  const { data: likedItems } = useQuery<number[]>({
    queryKey: ["/api/users/me/likes"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/users/me/likes", {
          credentials: "include",
        });
        if (response.status === 401) return [];
        if (!response.ok) throw new Error("Failed to fetch liked items");
        return response.json();
      } catch (error) {
        return [];
      }
    },
  });

  const isLiked = likedItems?.includes(itemId);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/items/${itemId}/like`);
        setLikesCount((prev) => prev - 1);
      } else {
        await apiRequest("POST", `/api/items/${itemId}/like`);
        setLikesCount((prev) => prev + 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/likes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        likeMutation.mutate();
      }}
      disabled={likeMutation.isPending}
    >
      <Heart
        className={`h-4 w-4 ${isLiked ? "fill-current text-red-500" : ""}`}
      />
      <span>{likesCount}</span>
    </Button>
  );
}
