import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, Music, Image, Video, CreditCard, User, Settings, Album, Key } from 'lucide-react';
import CreateAlbum from '@/components/music/CreateAlbum';
import MyMusic from '@/components/music/MyMusic';
import UploadMusic from '@/components/music/UploadMusic';
import UploadVideo from '@/components/media/UploadVideo';
import MyVideos from '@/components/media/MyVideos';
import ImageManager from '@/components/media/ImageManager';
import CreateFanCard from '@/components/fancard/CreateFanCard';
import MyFanCards from '@/components/fancard/MyFanCards';
import BioManager from '@/components/profile/BioManager';
import SocialMediaManager from '@/components/profile/SocialMediaManager';
import PublicProfileLink from '@/components/profile/PublicProfileLink';
import OverviewFanCardsGrid from '@/components/dashboard/OverviewFanCardsGrid';
import AlbumManager from '@/components/music/AlbumManager';
import AlbumApiKeys from '@/components/music/AlbumApiKeys';

const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();

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

  const navigateToTab = (tabValue: string) => {
    const tabTrigger = document.querySelector(`[data-value="${tabValue}"]`) as HTMLElement;
    if (tabTrigger) {
      tabTrigger.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user.user_metadata?.full_name || user.email}!
          </h1>
          <p className="text-muted-foreground">
            Manage your music, content, and fan cards from your dashboard.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="overview" className="flex items-center gap-2" style={{ color: '#C87343' }}>
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2" style={{ color: '#C87343' }}>
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Music</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2" style={{ color: '#C87343' }}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="fancards" className="flex items-center gap-2" style={{ color: '#C87343' }}>
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Fan Cards</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2" style={{ color: '#C87343' }}>
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Quick Actions</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigateToTab('music')} 
                      className="w-full justify-start" 
                      variant="ghost"
                      style={{ color: '#C87343' }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Album
                    </Button>
                    <Button 
                      onClick={() => navigateToTab('content')} 
                      className="w-full justify-start" 
                      variant="ghost"
                      style={{ color: '#C87343' }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Content
                    </Button>
                    <Button 
                      onClick={() => navigateToTab('fancards')} 
                      className="w-full justify-start" 
                      variant="ghost"
                      style={{ color: '#C87343' }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Create Fan Card
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Recent Activity</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No recent activity</p>
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
                      onClick={() => navigateToTab('profile')} 
                      className="w-full justify-start" 
                      variant="ghost"
                      style={{ color: '#C87343' }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      onClick={() => navigateToTab('profile')} 
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

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Statistics</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Loading stats...</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <OverviewFanCardsGrid />
          </TabsContent>

          <TabsContent value="music" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <Button className="flex items-center gap-2" style={{ color: '#C87343' }}>
                  <Plus className="h-4 w-4" />
                  Create New Project
                </Button>
                <Button variant="outline" onClick={() => navigateToTab('content')} className="flex items-center gap-2" style={{ color: '#C87343' }}>
                  <Upload className="h-4 w-4" />
                  Upload Music
                </Button>
              </div>
            </div>

            <Tabs defaultValue="albums" className="space-y-4">
              <TabsList>
                <TabsTrigger value="albums" style={{ color: '#C87343' }}>
                  <Album className="h-4 w-4 mr-2" />
                  Albums
                </TabsTrigger>
                <TabsTrigger value="tracks" style={{ color: '#C87343' }}>
                  <Music className="h-4 w-4 mr-2" />
                  All Tracks
                </TabsTrigger>
                <TabsTrigger value="manage" style={{ color: '#C87343' }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Albums
                </TabsTrigger>
                <TabsTrigger value="api-keys" style={{ color: '#C87343' }}>
                  <Key className="h-4 w-4 mr-2" />
                  API Keys
                </TabsTrigger>
              </TabsList>

              <TabsContent value="albums">
                <CreateAlbum />
              </TabsContent>

              <TabsContent value="tracks">
                <MyMusic />
              </TabsContent>

              <TabsContent value="manage">
                <AlbumManager />
              </TabsContent>

              <TabsContent value="api-keys">
                <AlbumApiKeys />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Tabs defaultValue="upload-music" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upload-music" style={{ color: '#C87343' }}>
                  <Music className="h-4 w-4 mr-2" />
                  Upload Music
                </TabsTrigger>
                <TabsTrigger value="upload-video" style={{ color: '#C87343' }}>
                  <Video className="h-4 w-4 mr-2" />
                  Upload Video
                </TabsTrigger>
                <TabsTrigger value="my-videos" style={{ color: '#C87343' }}>
                  <Video className="h-4 w-4 mr-2" />
                  My Videos
                </TabsTrigger>
                <TabsTrigger value="images" style={{ color: '#C87343' }}>
                  <Image className="h-4 w-4 mr-2" />
                  Images
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload-music">
                <UploadMusic />
              </TabsContent>

              <TabsContent value="upload-video">
                <UploadVideo />
              </TabsContent>

              <TabsContent value="my-videos">
                <MyVideos />
              </TabsContent>

              <TabsContent value="images">
                <ImageManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="fancards" className="space-y-6">
            <Tabs defaultValue="create" className="space-y-4">
              <TabsList>
                <TabsTrigger value="create" style={{ color: '#C87343' }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Fan Card
                </TabsTrigger>
                <TabsTrigger value="my-cards" style={{ color: '#C87343' }}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  My Fan Cards
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <CreateFanCard />
              </TabsContent>

              <TabsContent value="my-cards">
                <MyFanCards />
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
