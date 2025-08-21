
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Music, User, Settings, Album, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CreateAlbum from '@/components/music/CreateAlbum';
import MyMusic from '@/components/music/MyMusic';
import MyVideos from '@/components/media/MyVideos';
import BioManager from '@/components/profile/BioManager';
import SocialMediaManager from '@/components/profile/SocialMediaManager';
import PublicProfileLink from '@/components/profile/PublicProfileLink';
import AlbumManager from '@/components/music/AlbumManager';
import AlbumApiKeys from '@/components/music/AlbumApiKeys';
import { useNavigate } from 'react-router-dom';
import ProjectsGrid from '@/components/dashboard/ProjectsGrid';

const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user.user_metadata?.full_name || user.email}!
          </h1>
          <p className="text-muted-foreground">
            Manage your music projects, content, and profile from your dashboard.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="overview" className="flex items-center gap-2" style={{ color: '#C87343' }}>
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2" style={{ color: '#C87343' }}>
              <Album className="h-4 w-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2" style={{ color: '#C87343' }}>
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Quick Actions</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/projects')} 
                      className="w-full justify-start" 
                      variant="ghost"
                      style={{ color: '#C87343' }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                    <Button 
                      onClick={() => navigate('/projects')} 
                      className="w-full justify-start" 
                      variant="ghost"
                      style={{ color: '#C87343' }}
                    >
                      <Album className="h-4 w-4 mr-2" />
                      View Projects
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">New Workflow</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p className="text-muted-foreground">
                      Projects are now the center of your workflow.
                    </p>
                    <p className="text-muted-foreground">
                      Create projects first, then manage all content within each project.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Profile</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/dashboard?tab=profile')} 
                      className="w-full justify-start" 
                      variant="ghost"
                      style={{ color: '#C87343' }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      onClick={() => navigate('/dashboard?tab=profile')} 
                      className="w-full justify-start" 
                      variant="ghost"
                      style={{ color: '#C87343' }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projects Grid Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Album className="h-5 w-5" />
                    Your Projects
                  </CardTitle>
                  <Button 
                    onClick={() => navigate('/projects')} 
                    variant="outline"
                    style={{ color: '#C87343', borderColor: '#C87343' }}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ProjectsGrid />
              </CardContent>
            </Card>

            {/* Project-centered information */}
            <Card>
              <CardHeader>
                <CardTitle>🎵 New Project-Based Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">How it works now:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Create a new project (album/EP/single)</li>
                    <li>Inside each project, you can:</li>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>Upload music tracks specific to that project</li>
                      <li>Upload videos for that project</li>
                      <li>Create multiple fan cards with different designs</li>
                      <li>Manage all project-specific content in one place</li>
                    </ul>
                    <li>Each project gets its own API endpoint</li>
                    <li>Share and manage projects independently</li>
                  </ol>
                </div>
                
                <div className="flex gap-4">
                  <Button onClick={() => navigate('/projects')} style={{ color: '#C87343' }}>
                    <Album className="h-4 w-4 mr-2" />
                    Go to Projects
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Project Management</h2>
                <Button onClick={() => navigate('/projects')} style={{ color: '#C87343' }}>
                  <Album className="h-4 w-4 mr-2" />
                  View All Projects
                </Button>
              </div>
              <p className="text-muted-foreground">
                All content uploading and fan card creation now happens within individual projects. 
                Click "View All Projects" to see your projects and create new ones.
              </p>
            </div>

            <Tabs defaultValue="legacy" className="space-y-4">
              <TabsList>
                <TabsTrigger value="legacy" style={{ color: '#C87343' }}>
                  <Music className="h-4 w-4 mr-2" />
                  Legacy Content
                </TabsTrigger>
                <TabsTrigger value="manage" style={{ color: '#C87343' }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Legacy Management
                </TabsTrigger>
              </TabsList>

              <TabsContent value="legacy">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Legacy Music & Videos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        These are your existing tracks and videos. New uploads should be done within specific projects.
                      </p>
                      <MyMusic />
                      <div className="mt-6">
                        <MyVideos />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="manage">
                <div className="space-y-6">
                  <AlbumManager />
                  <AlbumApiKeys />
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BioManager />
              <SocialMediaManager />
            </div>
            <PublicProfileLink />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
