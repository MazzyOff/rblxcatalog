import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clothingTypes } from "@shared/schema";

export default function Admin() {
  const [robloxId, setRobloxId] = useState("");
  const [keywords, setKeywords] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const { toast } = useToast();

  const addItemMutation = useMutation({
    mutationFn: async (data: { id: string; type: string, keywords: string[] }) => {
      const res = await apiRequest("POST", "/api/items", data);
      return res.json();
    },
    onSuccess: () => {
      setRobloxId("");
      setKeywords("");
      setSelectedStyle("");
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Успех",
        description: "Товар успешно добавлен",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!robloxId || !selectedStyle) return;

    const keywordArray = keywords
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);

    addItemMutation.mutate({ 
      id: robloxId,
      type: selectedStyle,
      keywords: keywordArray
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Добавить новый товар</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="robloxId" className="block text-sm font-medium mb-1">
                ID товара Roblox
              </label>
              <Input
                id="robloxId"
                value={robloxId}
                onChange={(e) => setRobloxId(e.target.value)}
                placeholder="Например: 12345678"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Введите ID товара из Roblox каталога
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Стиль
              </label>
              <Select 
                value={selectedStyle} 
                onValueChange={setSelectedStyle}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите стиль" />
                </SelectTrigger>
                <SelectContent>
                  {clothingTypes.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="keywords" className="block text-sm font-medium mb-1">
                Ключевые слова
              </label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Например: аниме, крутой, популярный"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Введите ключевые слова через запятую для поиска
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={addItemMutation.isPending || !robloxId || !selectedStyle}
            >
              {addItemMutation.isPending ? "Добавление..." : "Добавить товар"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}