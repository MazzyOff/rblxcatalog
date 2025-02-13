import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clothingTypes } from "@shared/schema";

interface SearchFiltersProps {
  search: string;
  type: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}

export default function SearchFilters({
  search,
  type,
  onSearchChange,
  onTypeChange,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <Input
        placeholder="Поиск товаров..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите стиль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все стили</SelectItem>
            {clothingTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}