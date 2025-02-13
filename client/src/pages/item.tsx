import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Tag, User } from "lucide-react";
import { Link } from "wouter";
import { RobloxImage } from "@/components/RobloxImage";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";

export default function Item() {
  const [, params] = useRoute("/item/:id");
  const id = params?.id;

  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ["/api/items", id],
    queryFn: async () => {
      const response = await fetch(`/api/items/${id}`);
      if (!response.ok) throw new Error("Failed to fetch item");
      return response.json();
    },
  });

  const { data: seller, isLoading: isLoadingSeller } = useQuery({
    queryKey: ["/api/users", item?.sellerId],
    queryFn: async () => {
      if (!item?.sellerId) return null;
      const response = await fetch(`/api/users/${item.sellerId}`);
      if (!response.ok) throw new Error("Failed to fetch seller");
      return response.json();
    },
    enabled: !!item?.sellerId,
  });

  if (isLoadingItem) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px]" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    );
  }

  if (!item) {
    return <div>Item not found</div>;
  }

  return (
    <div className="space-y-4">
      <Link href="/">
        <Button variant="ghost" className="mb-2 -ml-2 h-8 px-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          <span className="text-sm">Назад</span>
        </Button>
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="aspect-square">
            <RobloxImage 
              assetId={item.robloxId} 
              alt={item.name} 
              size={420}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{item.name}</h1>
            <div className="flex justify-between items-center mt-2">
              <p className="text-lg font-semibold">R$ {item.price}</p>
              {seller && (
                <Link href={`/profile/${seller.id}`}>
                  <Button variant="ghost" size="sm" className="h-8">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm">{seller.username}</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium mb-1">Описание</h2>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>

          <div className="flex gap-4">
            <div>
              <h3 className="text-sm font-medium">Категория</h3>
              <p className="text-sm text-muted-foreground">{item.category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Тип</h3>
              <p className="text-sm text-muted-foreground">{item.type}</p>
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Теги
              </h3>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {item.keywords && item.keywords.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-1">Ключевые слова</h3>
              <div className="flex flex-wrap gap-1">
                {item.keywords.map((keyword: string) => (
                  <Badge key={keyword} variant="outline" className="text-xs px-2 py-0">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <a 
            href={`https://www.roblox.com/catalog/${item.robloxId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-4"
          >
            <Button className="w-full" size="lg">
              Купить на Roblox
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}