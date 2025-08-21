
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import CardDetailPage from '@/pages/CardDetailPage';
import FanCardConfigPage from "@/pages/FanCardConfigPage";
import FanCardDetailPage from "@/pages/FanCardDetailPage";
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsPage from '@/pages/ProjectsPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/project/:projectId" element={<ProjectDetailPage />} />
              <Route path="/card/:cardId" element={<CardDetailPage />} />
              <Route path="/fancard/:cardId" element={<FanCardDetailPage />} />
              <Route path="/fancard/:cardId/configure" element={<FanCardConfigPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
