import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface TabsLayoutProps {
  catalog: React.ReactNode;
  sellers: React.ReactNode;
}

export function TabsLayout({ catalog, sellers }: TabsLayoutProps) {
  const [location, setLocation] = useLocation();
  const currentTab = location === "/sellers" ? "sellers" : "catalog";

  useEffect(() => {
    if (location !== "/sellers" && location !== "/") {
      return;
    }
    setLocation(currentTab === "sellers" ? "/sellers" : "/");
  }, [currentTab, setLocation]);

  return (
    <Tabs value={currentTab} onValueChange={(value) => setLocation(value === "sellers" ? "/sellers" : "/")}>
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="catalog">Каталог</TabsTrigger>
        <TabsTrigger value="sellers">Продавцы</TabsTrigger>
      </TabsList>
      <TabsContent value="catalog">{catalog}</TabsContent>
      <TabsContent value="sellers">{sellers}</TabsContent>
    </Tabs>
  );
}
