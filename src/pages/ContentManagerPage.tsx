
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Video, Image, FileAudio, Headphones } from 'lucide-react';
import MyMusic from '@/components/music/MyMusic';
import MyVideos from '@/components/media/MyVideos';
import ImageManager from '@/components/media/ImageManager';
import PlaylistManager from '@/components/playlist/PlaylistManager';

const ContentManagerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground-dark mb-2">
            Content Manager
          </h1>
          <p className="text-muted-foreground">
            Manage all your media content in one place
          </p>
        </div>

        <Tabs defaultValue="music" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              Playlists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5" />
                  Music Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MyMusic />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MyVideos />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Image Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playlists">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Playlist Manager
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlaylistManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentManagerPage;
