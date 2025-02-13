import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) {
        if (res.status !== 401) {
          throw new Error("Failed to fetch user");
        }
        return null;
      }
      return res.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setLocation("/");
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });
    },
  });

  if (!user) {
    return null;
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-sm sm:text-base">
              Roblox Clothing Catalog
            </span>
          </Link>
        </div>

        {/* Мобильное меню */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-sm text-muted-foreground">
                {user.username}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile">Мой профиль</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin">Панель управления</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/sellers">Продавцы</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Выход..." : "Выйти"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Десктопное меню */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.username}
          </span>
          <Link href="/profile">
            <Button variant="ghost">Мой профиль</Button>
          </Link>
          <Link href="/admin">
            <Button variant="ghost">Панель управления</Button>
          </Link>
          <Link href="/sellers">
            <Button variant="ghost">Продавцы</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Выход..." : "Выйти"}
          </Button>
        </div>
      </div>
    </nav>
  );
}