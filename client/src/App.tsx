import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Catalog from "@/pages/catalog";
import Item from "@/pages/item";
import Admin from "@/pages/admin";
import Auth from "@/pages/auth";
import Profile from "@/pages/profile";
import Navbar from "@/components/navbar";
import { ProtectedRoute } from "./components/protected-route";
import Sellers from "@/pages/sellers";
import { TabsLayout } from "@/components/TabsLayout";

function MainLayout() {
  return <TabsLayout catalog={<Catalog />} sellers={<Sellers />} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainLayout} />
      <Route path="/sellers" component={MainLayout} />
      <Route path="/item/:id" component={Item} />
      <Route path="/auth" component={Auth} />
      <ProtectedRoute path="/admin" component={Admin} />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route path="/profile/:id" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;