
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { X, Move, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LandingPageElement {
  id: string;
  type: 'text' | 'image' | 'music_player' | 'video' | 'button';
  position: { x: number; y: number };
  properties: Record<string, any>;
  size: { width: number; height: number };
}

interface DraggableElementProps {
  element: LandingPageElement;
  isSelected: boolean;
  onUpdate: (elementId: string, updates: Partial<LandingPageElement>) => void;
  onDelete: (elementId: string) => void;
  onClick: () => void;
  theme: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  albumId: string;
}

const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  isSelected,
  onUpdate,
  onDelete,
  onClick,
  theme,
  albumId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showProperties, setShowProperties] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (element.type === 'music_player') {
      fetchTracks();
    } else if (element.type === 'video') {
      fetchVideos();
    }
  }, [element.type, albumId]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === elementRef.current || (e.target as Element).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - element.position.x,
        y: e.clientY - element.position.y
      });
      onClick();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: Math.max(0, e.clientX - dragOffset.x),
        y: Math.max(0, e.clientY - dragOffset.y)
      };
      
      onUpdate(element.id, { position: newPosition });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handlePropertyChange = (property: string, value: any) => {
    onUpdate(element.id, {
      properties: { ...element.properties, [property]: value }
    });
  };

  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return (
          <div
            style={{
              fontSize: element.properties.fontSize || 16,
              fontWeight: element.properties.fontWeight || 'normal',
              color: theme.textColor
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
              <div className="text-xs text-gray-500">Select a track</div>
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
              <div className="text-xs text-gray-500">Select a video</div>
            )}
          </div>
        );
      
      case 'button':
        return (
          <Button
            style={{ backgroundColor: theme.accentColor }}
            className="w-full h-full"
          >
            {element.properties.text || 'Click me'}
          </Button>
        );
      
      default:
        return <div>Unknown element</div>;
    }
  };

  const renderProperties = () => {
    switch (element.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Textarea
              placeholder="Enter text content"
              value={element.properties.content || ''}
              onChange={(e) => handlePropertyChange('content', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Font size"
              value={element.properties.fontSize || 16}
              onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value))}
            />
            <Select
              value={element.properties.fontWeight || 'normal'}
              onValueChange={(value) => handlePropertyChange('fontWeight', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            <Input
              placeholder="Image URL"
              value={element.properties.src || ''}
              onChange={(e) => handlePropertyChange('src', e.target.value)}
            />
            <Input
              placeholder="Alt text"
              value={element.properties.alt || ''}
              onChange={(e) => handlePropertyChange('alt', e.target.value)}
            />
          </div>
        );
      
      case 'music_player':
        return (
          <div className="space-y-2">
            <Select
              value={element.properties.trackId || ''}
              onValueChange={(value) => handlePropertyChange('trackId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select track" />
              </SelectTrigger>
              <SelectContent>
                {tracks.map((track) => (
                  <SelectItem key={track.id} value={track.id}>
                    {track.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            <Select
              value={element.properties.videoId || ''}
              onValueChange={(value) => handlePropertyChange('videoId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select video" />
              </SelectTrigger>
              <SelectContent>
                {videos.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'button':
        return (
          <div className="space-y-2">
            <Input
              placeholder="Button text"
              value={element.properties.text || ''}
              onChange={(e) => handlePropertyChange('text', e.target.value)}
            />
            <Input
              placeholder="Link URL (optional)"
              value={element.properties.link || ''}
              onChange={(e) => handlePropertyChange('link', e.target.value)}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <div
        ref={elementRef}
        className={`absolute border-2 cursor-move ${
          isSelected ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
        }`}
        style={{
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height
        }}
        onMouseDown={handleMouseDown}
        onClick={onClick}
      >
        {renderElement()}
        
        {isSelected && (
          <div className="absolute -top-8 right-0 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
              onClick={() => setShowProperties(!showProperties)}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 drag-handle"
            >
              <Move className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
              onClick={() => onDelete(element.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {showProperties && isSelected && (
        <Card className="absolute z-50 p-4 w-64" style={{ 
          left: element.position.x + element.size.width + 10,
          top: element.position.y
        }}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Properties</h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setShowProperties(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {renderProperties()}
        </Card>
      )}
    </>
  );
};

export default DraggableElement;
