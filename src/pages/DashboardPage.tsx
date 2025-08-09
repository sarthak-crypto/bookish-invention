import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Music, 
  Video, 
  CreditCard, 
  BarChart3, 
  User,
  Upload,
  ShoppingCart,
  Settings,
  Plus,
  Library,
  Settings2,
  Zap
} from 'lucide-react';
import CreateAlbum from '@/components/music/CreateAlbum';
import MyMusic from '@/components/music/MyMusic';
import AlbumManager from '@/components/music/AlbumManager';
import RFIDCardManager from '@/components/music/RFIDCardManager';
import AlbumApiKeys from '@/components/music/AlbumApiKeys';
import PlaylistManager from '@/components/playlist/PlaylistManager';
import UploadMusic from '@/components/music/UploadMusic';
import MyVideos from '@/components/media/MyVideos';
import UploadVideo from '@/components/media/UploadVideo';
import CreateFanCard from '@/components/fancard/CreateFanCard';
import MyFanCards from '@/components/fancard/MyFanCards';
import FanCardMarketplace from '@/components/fancard/FanCardMarketplace';
import ArtistAnalyticsDashboard from '@/components/analytics/ArtistAnalyticsDashboard';
import DetailedAnalytics from '@/components/analytics/DetailedAnalytics';
import ImageManager from '@/components/media/ImageManager';
import BioManager from '@/components/profile/BioManager';
import SocialMediaManager from '@/components/profile/SocialMediaManager';
import OverviewFanCardsGrid from '@/components/dashboard/OverviewFanCardsGrid';

const DashboardPage = () => {
  const { user, isLoading } = useAuth();
  const [musicActiveTab, setMusicActiveTab] = React.useState<string | null>(null);

  const navigateToTab = (tabValue: string) => {
    const tabTrigger = document.querySelector(`[data-state="inactive"][value="${tabValue}"]`) as HTMLElement;
    if (tabTrigger) {
      tabTrigger.click();
    }
  };

  const handleMusicCardClick = (tabValue: string) => {
    setMusicActiveTab(tabValue);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600">
            Manage your music, fan cards, and connect with your audience.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="fan-cards" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Fan Cards
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Quick Start
                  </CardTitle>
                  <CardDescription>Get started with your music journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={() => navigateToTab('music')}>
                    Create Your First Album
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigateToTab('content')}>
                    Upload Music
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Fan Engagement
                  </CardTitle>
                  <CardDescription>Connect with your audience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={() => navigateToTab('fan-cards')}>
                    Create Fan Cards
                  </Button>
                  <Button variant="outline" className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Insights
                  </CardTitle>
                  <CardDescription>Track your performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Analytics Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Fan Cards Grid */}
            <OverviewFanCardsGrid />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Your recent activity will appear here...</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Your performance metrics will appear here...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Music Management Section */}
          <TabsContent value="music" className="space-y-6">
            {!musicActiveTab ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Music Management</h2>
                  <p className="text-gray-600">Create, manage, and organize your music content</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleMusicCardClick('create-album')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Create Album
                      </CardTitle>
                      <CardDescription>Start creating your next album project</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Set up a new album with cover art, track listings, and metadata.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleMusicCardClick('my-music')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Library className="h-5 w-5 text-primary" />
                        My Music
                      </CardTitle>
                      <CardDescription>Browse and manage your music library</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        View all your uploaded tracks, edit details, and organize your music.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleMusicCardClick('manage-albums')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        Manage Albums
                      </CardTitle>
                      <CardDescription>Edit and organize your album collections</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Update album information, reorder tracks, and manage releases.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleMusicCardClick('rfid-cards')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        RFID Cards
                      </CardTitle>
                      <CardDescription>Manage physical music cards and NFC integration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Configure RFID cards for contactless music sharing and fan engagement.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleMusicCardClick('api-keys')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        API Keys
                      </CardTitle>
                      <CardDescription>Manage API access and integrations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Generate and manage API keys for third-party integrations and services.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Button onClick={() => handleMusicCardClick('create-album')} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Album
                    </Button>
                    <Button variant="outline" onClick={() => navigateToTab('content')} className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Music
                    </Button>
                    <Button variant="outline" onClick={() => handleMusicCardClick('my-music')} className="flex items-center gap-2">
                      <Library className="h-4 w-4" />
                      View Library
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setMusicActiveTab(null)}
                    className="flex items-center gap-2"
                  >
                    ← Back to Music Overview
                  </Button>
                </div>
                
                {musicActiveTab === 'create-album' && <CreateAlbum />}
                {musicActiveTab === 'my-music' && <MyMusic />}
                {musicActiveTab === 'manage-albums' && <AlbumManager />}
                {musicActiveTab === 'rfid-cards' && <RFIDCardManager />}
                {musicActiveTab === 'api-keys' && <AlbumApiKeys />}
              </div>
            )}
          </TabsContent>

          {/* Content Creation Section */}
          <TabsContent value="content" className="space-y-4">
            <Tabs defaultValue="upload-music" className="space-y-4">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1">
                <TabsTrigger value="upload-music">Upload Music</TabsTrigger>
                <TabsTrigger value="upload-video">Upload Video</TabsTrigger>
                <TabsTrigger value="manage-images">Manage Images</TabsTrigger>
              </TabsList>
              <TabsContent value="upload-music">
                <UploadMusic />
              </TabsContent>
              <TabsContent value="upload-video">
                <UploadVideo />
              </TabsContent>
              <TabsContent value="manage-images">
                <ImageManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Fan Cards Section */}
          <TabsContent value="fan-cards" className="space-y-4">
            <Tabs defaultValue="create-card" className="space-y-4">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1">
                <TabsTrigger value="create-card">Create Fan Card</TabsTrigger>
                <TabsTrigger value="my-cards">My Fan Cards</TabsTrigger>
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              </TabsList>
              <TabsContent value="create-card">
                <CreateFanCard />
              </TabsContent>
              <TabsContent value="my-cards">
                <MyFanCards />
              </TabsContent>
              <TabsContent value="marketplace">
                <FanCardMarketplace />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Profile Section */}
          <TabsContent value="profile" className="space-y-4">
            <Tabs defaultValue="bio" className="space-y-4">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-1">
                <TabsTrigger value="bio">Bio & Profile</TabsTrigger>
                <TabsTrigger value="social">Social Media</TabsTrigger>
              </TabsList>
              <TabsContent value="bio">
                <BioManager />
              </TabsContent>
              <TabsContent value="social">
                <SocialMediaManager />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
