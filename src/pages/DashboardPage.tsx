import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Album, CreditCard, Plus, ShoppingCart, Video, Upload, Settings, BarChart3, Palette } from 'lucide-react';

// Import our components
import UploadMusic from '@/components/music/UploadMusic';
import MyMusic from '@/components/music/MyMusic';
import MyVideos from '@/components/media/MyVideos';
import UploadVideo from '@/components/media/UploadVideo';
import CreateAlbum from '@/components/music/CreateAlbum';
import AlbumManager from '@/components/music/AlbumManager';
import CreateFanCard from '@/components/fancard/CreateFanCard';
import MyFanCards from '@/components/fancard/MyFanCards';
import FanCardMarketplace from '@/components/fancard/FanCardMarketplace';
import ArtistAnalyticsDashboard from '@/components/analytics/ArtistAnalyticsDashboard';
import DetailedAnalytics from '@/components/analytics/DetailedAnalytics';

import ImageManager from '@/components/media/ImageManager';
import BioManager from '@/components/profile/BioManager';
import SocialMediaManager from '@/components/profile/SocialMediaManager';
import PublicProfileLink from '@/components/profile/PublicProfileLink';
import PlaylistManager from '@/components/playlist/PlaylistManager';

const DashboardPage: React.FC = () => {
  const { user, isLoading, signOut } = useAuth();
  const { isSuperAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('analytics');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground-dark">Artist Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full md:w-auto">
          {isSuperAdmin && (
            <Button 
              onClick={() => navigate('/admin')} 
              variant="outline"
              className="bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          )}
          <Button 
            onClick={signOut} 
            variant="outline"
          >
            Logout
          </Button>
        </div>
      </header>
      
      <div className="container mx-auto">
        <p className="text-xl mb-4 text-foreground">Welcome, {user.email}!</p>
        
        <div className="mb-8">
          <Button 
            onClick={() => navigate('/albums')} 
            variant="outline"
            className="mr-4"
          >
            <Album className="h-4 w-4 mr-2" />
            Manage Albums
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1 h-auto p-1">
            <TabsTrigger value="analytics" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" /> 
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
              <Music className="h-3 w-3 md:h-4 md:w-4" /> 
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
              <Palette className="h-3 w-3 md:h-4 md:w-4" /> 
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
              <Settings className="h-3 w-3 md:h-4 md:w-4" /> 
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
              <CreditCard className="h-3 w-3 md:h-4 md:w-4" /> 
              <span className="hidden sm:inline">Cards</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
              <Plus className="h-3 w-3 md:h-4 md:w-4" /> 
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Section */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overview Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ArtistAnalyticsDashboard />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <DetailedAnalytics />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Media Management Section */}
          <TabsContent value="media" className="space-y-4">
            <Tabs defaultValue="music" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
                <TabsTrigger value="music">My Music</TabsTrigger>
                <TabsTrigger value="videos">My Videos</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
              </TabsList>
              <TabsContent value="music">
                <MyMusic />
              </TabsContent>
              <TabsContent value="videos">
                <MyVideos />
              </TabsContent>
              <TabsContent value="images">
                <ImageManager />
              </TabsContent>
              <TabsContent value="playlists">
                <PlaylistManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Content Creation Section */}
          <TabsContent value="content" className="space-y-4">
            <Tabs defaultValue="upload-music" className="space-y-4">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-1">
                <TabsTrigger value="upload-music">Upload Music</TabsTrigger>
                <TabsTrigger value="upload-video">Upload Video</TabsTrigger>
              </TabsList>
              <TabsContent value="upload-music">
                <UploadMusic />
              </TabsContent>
              <TabsContent value="upload-video">
                <UploadVideo />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Profile Management Section */}
          <TabsContent value="profile" className="space-y-4">
            <PublicProfileLink />
            <BioManager />
            <SocialMediaManager />
          </TabsContent>

          {/* Fan Cards Section */}
          <TabsContent value="cards" className="space-y-4">
            <Tabs defaultValue="my-cards" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my-cards">My Fan Cards</TabsTrigger>
                <TabsTrigger value="marketplace">Order Cards</TabsTrigger>
              </TabsList>
              <TabsContent value="my-cards" className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
                <CreateFanCard />
                <MyFanCards />
              </TabsContent>
              <TabsContent value="marketplace">
                <FanCardMarketplace />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Tools & Album Management */}
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Album Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CreateAlbum />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Album Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <AlbumManager />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
