import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import CatalogGrid from "@/components/catalog-grid";
import { Loader2, Pencil, Heart } from "lucide-react"; // Import Heart icon
import { useRoute } from "wouter";
import type { UpdateProfile } from "@shared/schema";
import type { User } from '@shared/schema'; // Assuming User interface is defined elsewhere

interface ProfileUser extends Omit<User, 'password'> {
  totalLikes: number;
  itemsCount: number;
}

export default function Profile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [description, setDescription] = useState("");
  const [, params] = useRoute("/profile/:id");
  const userId = params?.id;

  const { data: currentUser } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const response = await fetch("/api/me", { credentials: "include" });
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error("Failed to fetch user data");
      }
      return response.json();
    },
  });

  const { data: profileUser, isLoading: isLoadingUser } = useQuery<ProfileUser>({ // Type added here
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const id = userId || currentUser?.id;
      if (!id) return null;
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
    enabled: !!(userId || currentUser?.id),
  });

  const { data: userItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ["/api/items", profileUser?.id],
    queryFn: async () => {
      if (!profileUser?.id) return [];
      const response = await fetch(`/api/items?sellerId=${profileUser.id}`);
      if (!response.ok) throw new Error("Failed to fetch user items");
      return response.json();
    },
    enabled: !!profileUser?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setIsEditing(false);
      toast({
        title: "Профиль обновлен",
        description: "Ваши изменения успешно сохранены",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setAvatarUrl(profileUser?.avatarUrl || "");
    setDescription(profileUser?.description || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      avatarUrl: avatarUrl || undefined,
      description: description || undefined,
    });
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profileUser) return null;

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Профиль продавца</CardTitle>
          {isOwnProfile && !isEditing && (
            <Button variant="ghost" size="icon" onClick={handleEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-4">
              <UserAvatar user={profileUser} className="w-24 h-24" />
              <div className="text-center">
                <h2 className="font-semibold">{profileUser.username}</h2>
                <div className="flex items-center justify-center gap-4 mt-1 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{profileUser.totalLikes}</span>
                  </div>
                  <div>
                    <span>{profileUser.itemsCount} товаров</span>
                  </div>
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL аватара</label>
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">О себе</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Расскажите о себе..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Сохранение..." : "Сохранить"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                {profileUser.description ? (
                  <p className="text-muted-foreground">{profileUser.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">Описание не добавлено</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Товары продавца</h2>
        {isLoadingItems ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : userItems && userItems.length > 0 ? (
          <CatalogGrid items={userItems} />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              У продавца пока нет добавленных товаров
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}