import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import AlbumsPage from "./pages/AlbumsPage";
import AdminDashboard from "./pages/AdminDashboard";
import EndUserPage from "./pages/EndUserPage";
import AlbumPreviewPage from "./pages/AlbumPreviewPage";
import PublicArtistPage from "./pages/PublicArtistPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import NotFound from "./pages/NotFound";
import CardDetailPage from "./pages/CardDetailPage";
import ContentManagerPage from "./pages/ContentManagerPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/albums" element={<AlbumsPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/project/:projectId" element={<ProjectDetailPage />} />
              <Route path="/card/:cardId" element={<CardDetailPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/listen" element={<EndUserPage />} />
              <Route path="/album-preview/:albumId" element={<AlbumPreviewPage />} />
              <Route path="/artist/:artistId" element={<PublicArtistPage />} />
              <Route path="/content" element={<ContentManagerPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
