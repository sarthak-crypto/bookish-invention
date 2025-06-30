
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Video } from 'lucide-react';
import SecureMusicPlayer from '@/components/media/SecureMusicPlayer';
import SecureVideoPlayer from '@/components/media/SecureVideoPlayer';

interface Track {
  id: string;
  title: string;
  file_url: string;
  duration: number | null;
}

interface Video {
  id: string;
  title: string;
  file_url: string;
  thumbnail_url: string | null;
  duration: number | null;
}

interface EndUserMediaPlayerProps {
  tracks: Track[];
  videos: Video[];
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
  onTrackEnd: () => void;
  albumTitle: string;
  artistName: string;
}

const EndUserMediaPlayer: React.FC<EndUserMediaPlayerProps> = ({
  tracks,
  videos,
  currentTrackIndex,
  onTrackChange,
  onTrackEnd,
  albumTitle,
  artistName
}) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(tracks.length > 0 ? 'music' : 'videos');

  const currentTrack = tracks[currentTrackIndex];
  const currentVideo = videos[selectedVideoIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Now Playing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="music" disabled={tracks.length === 0}>
              <Music className="h-4 w-4 mr-2" />
              Music ({tracks.length})
            </TabsTrigger>
            <TabsTrigger value="videos" disabled={videos.length === 0}>
              <Video className="h-4 w-4 mr-2" />
              Videos ({videos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music" className="space-y-4">
            {currentTrack ? (
              <div className="space-y-4">
                <SecureMusicPlayer
                  track={{
                    ...currentTrack,
                    albums: { title: albumTitle }
                  }}
                  onTrackEnd={onTrackEnd}
                />
                
                {/* Track List */}
                {tracks.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Track List</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tracks.map((track, index) => (
                          <div
                            key={track.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              index === currentTrackIndex
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => onTrackChange(index)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{track.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {artistName}
                                </div>
                              </div>
                              {track.duration && (
                                <div className="text-sm text-muted-foreground">
                                  {Math.floor(track.duration / 60)}:
                                  {(track.duration % 60).toString().padStart(2, '0')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tracks available for this album</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            {currentVideo ? (
              <div className="space-y-4">
                <SecureVideoPlayer
                  video={currentVideo}
                />
                
                {/* Video List */}
                {videos.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Video List</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {videos.map((video, index) => (
                          <div
                            key={video.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              index === selectedVideoIndex
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedVideoIndex(index)}
                          >
                            <div className="flex items-center gap-3">
                              {video.thumbnail_url ? (
                                <img
                                  src={video.thumbnail_url}
                                  alt={video.title}
                                  className="w-16 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                                  <Video className="h-4 w-4" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{video.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {artistName}
                                </div>
                              </div>
                              {video.duration && (
                                <div className="text-sm text-muted-foreground">
                                  {Math.floor(video.duration / 60)}:
                                  {(video.duration % 60).toString().padStart(2, '0')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No videos available from this artist</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EndUserMediaPlayer;
