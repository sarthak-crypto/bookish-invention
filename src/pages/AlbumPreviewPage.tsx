import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface LandingPageElement {
  id: string;
  type: 'text' | 'image' | 'music_player' | 'video' | 'button';
  position: { x: number; y: number };
  properties: Record<string, any>;
  size: { width: number; height: number };
}

interface LandingPageData {
  id: string;
  album_id: string;
  title: string;
  elements: LandingPageElement[];
  theme: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  is_published: boolean;
}

const AlbumPreviewPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [pageData, setPageData] = useState<LandingPageData | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (albumId) {
      fetchLandingPage();
      fetchTracks();
      fetchVideos();
    }
  }, [albumId]);

  const fetchLandingPage = async () => {
    try {
      const { data, error } = await supabase
        .from('album_landing_pages')
        .select('*')
        .eq('album_id', albumId)
        .eq('is_published', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching landing page:', error);
        setError('Failed to load landing page');
      } else if (!data) {
        setError('No published landing page found for this album');
      } else {
        setPageData({
          id: data.id,
          album_id: data.album_id,
          title: data.title,
          elements: (data.elements as unknown as LandingPageElement[]) || [],
          theme: (data.theme as unknown as {
            backgroundColor: string;
            textColor: string;
            accentColor: string;
          }) || {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            accentColor: '#3b82f6'
          },
          is_published: data.is_published
        });
      }
    } catch (error) {
      console.error('Error fetching landing page:', error);
      setError('Failed to load landing page');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', albumId);
      
      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      // Get album owner first
      const { data: album } = await supabase
        .from('albums')
        .select('user_id')
        .eq('id', albumId)
        .single();

      if (album) {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('user_id', album.user_id);
        
        if (error) throw error;
        setVideos(data || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const renderElement = (element: LandingPageElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div
            style={{
              fontSize: element.properties.fontSize || 16,
              fontWeight: element.properties.fontWeight || 'normal',
              color: pageData?.theme.textColor
            }}
          >
            {element.properties.content || 'Enter your text'}
          </div>
        );
      
      case 'image':
        return (
          <img
            src={element.properties.src || '/placeholder.svg'}
            alt={element.properties.alt || 'Image'}
            className="w-full h-full object-cover rounded"
          />
        );
      
      case 'music_player':
        const track = tracks.find(t => t.id === element.properties.trackId);
        return (
          <div className="p-2 bg-gray-100 rounded">
            <div className="text-sm font-medium mb-2">
              {track?.title || 'Music Player'}
            </div>
            {track ? (
              <audio controls className="w-full">
                <source src={track.file_url} />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div className="text-xs text-gray-500">Track not found</div>
            )}
          </div>
        );
      
      case 'video':
        const video = videos.find(v => v.id === element.properties.videoId);
        return (
          <div className="p-2 bg-gray-100 rounded">
            <div className="text-sm font-medium mb-2">
              {video?.title || 'Video Player'}
            </div>
            {video ? (
              <video controls className="w-full">
                <source src={video.file_url} />
                Your browser does not support the video element.
              </video>
            ) : (
              <div className="text-xs text-gray-500">Video not found</div>
            )}
          </div>
        );
      
      case 'button':
        return (
          <Button
            style={{ backgroundColor: pageData?.theme.accentColor }}
            className="w-full h-full"
            onClick={() => {
              if (element.properties.link) {
                window.open(element.properties.link, '_blank');
              }
            }}
          >
            {element.properties.text || 'Click me'}
          </Button>
        );
      
      default:
        return <div>Unknown element</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading album page...</div>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Page Not Available</h2>
          <p className="text-muted-foreground">
            {error || 'This album page is not available or has not been published yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ backgroundColor: pageData.theme.backgroundColor }}
    >
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: pageData.theme.textColor }}>
          {pageData.title}
        </h1>
        
        <div className="relative" style={{ minHeight: '600px' }}>
          {pageData.elements.map((element) => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: element.position.x,
                top: element.position.y,
                width: element.size.width,
                height: element.size.height
              }}
            >
              {renderElement(element)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlbumPreviewPage;
