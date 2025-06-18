import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Album, CreditCard, Plus, ShoppingCart, Video, Upload, Settings, BarChart3 } from 'lucide-react';

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
    <div className="min-h-screen bg-background p-8">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-foreground-dark">Artist Dashboard</h1>
        <div className="flex gap-4">
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
        <p className="text-xl mb-8 text-foreground">Welcome, {user.email}!</p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="analytics" className="flex items-center justify-center gap-2">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="my-music" className="flex items-center justify-center gap-2">
              <Music className="h-4 w-4" /> My Music
            </TabsTrigger>
            <TabsTrigger value="my-videos" className="flex items-center justify-center gap-2">
              <Video className="h-4 w-4" /> My Videos
            </TabsTrigger>
            <TabsTrigger value="upload-music" className="flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Upload Music
            </TabsTrigger>
            <TabsTrigger value="upload-video" className="flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" /> Upload Video
            </TabsTrigger>
            <TabsTrigger value="albums" className="flex items-center justify-center gap-2">
              <Album className="h-4 w-4" /> Albums
            </TabsTrigger>
            <TabsTrigger value="fan-cards" className="flex items-center justify-center gap-2">
              <CreditCard className="h-4 w-4" /> My Fan Cards
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Order Cards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <ArtistAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="my-music" className="space-y-4">
            <MyMusic />
          </TabsContent>

          <TabsContent value="my-videos" className="space-y-4">
            <MyVideos />
          </TabsContent>

          <TabsContent value="upload-music" className="space-y-4">
            <UploadMusic />
          </TabsContent>

          <TabsContent value="upload-video" className="space-y-4">
            <UploadVideo />
          </TabsContent>

          <TabsContent value="albums" className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CreateAlbum />
            <AlbumManager />
          </TabsContent>

          <TabsContent value="fan-cards" className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CreateFanCard />
            <MyFanCards />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <FanCardMarketplace />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
