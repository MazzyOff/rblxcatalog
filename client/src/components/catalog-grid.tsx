import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RobloxImage } from "./RobloxImage";
import type { ClothingItem } from "@shared/schema";
import { ExternalLink, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "./LikeButton";

interface CatalogGridProps {
  items: (ClothingItem & { seller: { username: string } })[];
}

export default function CatalogGrid({ items }: CatalogGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((item) => (
        <Link key={item.id} href={`/item/${item.id}`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-lg h-full">
            <CardContent className="p-2">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <RobloxImage 
                  assetId={item.robloxId} 
                  alt={item.name} 
                  size={420} 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-1 p-2">
              <h3 className="font-semibold text-xs line-clamp-2">{item.name}</h3>
              <div className="flex items-center justify-between w-full text-xs">
                {item.sellerId && (
                  <Link href={`/profile/${item.sellerId}`} onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                      <User className="h-3 w-3 mr-1" />
                      {item.seller?.username || 'Неизвестный продавец'}
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <LikeButton itemId={item.id} initialLikesCount={item.likesCount} />
                  <span className="font-medium">R$ {item.price}</span>
                </div>
              </div>
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tags.slice(0, 1).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 1 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      +{item.tags.length - 1}
                    </Badge>
                  )}
                </div>
              )}
              <a 
                href={`https://www.roblox.com/catalog/${item.robloxId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full mt-1"
              >
                <Button className="w-full text-[10px] h-7" variant="secondary" size="sm">
                  Купить
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </a>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}