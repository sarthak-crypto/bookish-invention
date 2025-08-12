
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import CardDetailPage from "./pages/CardDetailPage";
import FanCardDetailPage from "./pages/FanCardDetailPage";
import AlbumsPage from "./pages/AlbumsPage";
import AlbumPreviewPage from "./pages/AlbumPreviewPage";
import EndUserPage from "./pages/EndUserPage";
import PublicArtistPage from "./pages/PublicArtistPage";
import AdminDashboard from "./pages/AdminDashboard";
import ContentManagerPage from "./pages/ContentManagerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/project/:id" element={<ProjectDetailPage />} />
                <Route path="/card/:cardId" element={<CardDetailPage />} />
                <Route path="/fan-card/:cardId" element={<FanCardDetailPage />} />
                <Route path="/albums" element={<AlbumsPage />} />
                <Route path="/album/:id" element={<AlbumPreviewPage />} />
                <Route path="/end-user/:cardId" element={<EndUserPage />} />
                <Route path="/artist/:userId" element={<PublicArtistPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/content-manager" element={<ContentManagerPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
