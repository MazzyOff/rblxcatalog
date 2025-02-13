import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Heart, Loader2 } from "lucide-react";
import type { User } from "@shared/schema";

interface SellerWithStats extends Omit<User, 'password'> {
  totalLikes: number;
  itemsCount: number;
}

export default function Sellers() {
  const { data: sellers, isLoading } = useQuery<SellerWithStats[]>({
    queryKey: ["/api/sellers"],
    queryFn: async () => {
      const response = await fetch("/api/sellers");
      if (!response.ok) throw new Error("Failed to fetch sellers");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Продавцы</h1>
        <p className="text-muted-foreground mt-1">
          Познакомьтесь с нашими талантливыми создателями одежды
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sellers?.map((seller) => (
          <Link key={seller.id} href={`/profile/${seller.id}`}>
            <Card className="cursor-pointer transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4">
                <UserAvatar user={seller} className="w-16 h-16" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{seller.username}</h2>
                  {seller.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {seller.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{seller.totalLikes}</span>
                    </div>
                    <div>
                      <span>{seller.itemsCount} товаров</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}