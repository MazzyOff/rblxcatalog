import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchFilters from "@/components/search-filters";
import CatalogGrid from "@/components/catalog-grid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = 'price_desc' | 'price_asc' | 'likes_desc' | 'date_desc' | 'popularity_desc';

const sortOptions = {
  price_desc: { label: 'Цена (высокая к низкой)', by: 'price', order: 'desc' },
  price_asc: { label: 'Цена (низкая к высокой)', by: 'price', order: 'asc' },
  likes_desc: { label: 'По количеству лайков', by: 'likesCount', order: 'desc' },
  date_desc: { label: 'По дате загрузки', by: 'createdAt', order: 'desc' },
  popularity_desc: { label: 'По популярности', by: 'popularity', order: 'desc' },
} as const;

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortOption>("date_desc");

  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/items", search, type, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (type && type !== "all") params.set("type", type);

      const { by, order } = sortOptions[sort];
      params.set("sortBy", by);
      params.set("sortOrder", order);

      const response = await fetch(`/api/items?${params}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Каталог одежды</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Найдите подходящую одежду для вашего персонажа в Roblox
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <SearchFilters
          search={search}
          type={type}
          onSearchChange={setSearch}
          onTypeChange={setType}
        />

        <Select value={sort} onValueChange={(value: SortOption) => setSort(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Сортировать по" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortOptions).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : (
        <CatalogGrid items={items || []} />
      )}
    </div>
  );
}