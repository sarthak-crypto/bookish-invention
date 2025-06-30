import React, { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Eye, Palette } from 'lucide-react';
import DragDropCanvas from './DragDropCanvas';
import ElementPalette from './ElementPalette';

interface Album {
  id: string;
  title: string;
  artwork_url: string | null;
}

interface LandingPageElement {
  id: string;
  type: 'text' | 'image' | 'music_player' | 'video' | 'button';
  position: { x: number; y: number };
  properties: Record<string, any>;
  size: { width: number; height: number };
}

interface LandingPageData {
  id?: string;
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

const LandingPageDesigner: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageData, setPageData] = useState<LandingPageData>({
    album_id: '',
    title: '',
    elements: [],
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#3b82f6'
    },
    is_published: false
  });

  React.useEffect(() => {
    if (user) {
      fetchAlbums();
    }
  }, [user]);

  const fetchAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('id, title, artwork_url')
        .eq('user_id', user?.id)
        .order('title');

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
      toast({
        title: "Error",
        description: "Failed to fetch albums",
        variant: "destructive",
      });
    }
  };

  const handleAlbumSelect = async (albumId: string) => {
    setSelectedAlbumId(albumId);
    const album = albums.find(a => a.id === albumId);
    
    // Try to load existing landing page for this album
    try {
      const { data, error } = await supabase
        .from('album_landing_pages')
        .select('*')
        .eq('album_id', albumId)
        .maybeSingle();

      if (data && !error) {
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
          is_published: data.is_published || false
        });
      } else {
        // Create new landing page data
        setPageData({
          album_id: albumId,
          title: `${album?.title} - Landing Page`,
          elements: [],
          theme: {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            accentColor: '#3b82f6'
          },
          is_published: false
        });
      }
    } catch (error) {
      console.error('Error loading landing page:', error);
      // Create new landing page data on error
      setPageData({
        album_id: albumId,
        title: `${album?.title} - Landing Page`,
        elements: [],
        theme: {
          backgroundColor: '#ffffff',
          textColor: '#000000',
          accentColor: '#3b82f6'
        },
        is_published: false
      });
    }
  };

  const handleAddElement = useCallback((elementType: string) => {
    const newElement: LandingPageElement = {
      id: `element_${Date.now()}`,
      type: elementType as any,
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      properties: getDefaultProperties(elementType)
    };

    setPageData(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
  }, []);

  const getDefaultProperties = (type: string): Record<string, any> => {
    switch (type) {
      case 'text':
        return { content: 'Enter your text', fontSize: 16, fontWeight: 'normal' };
      case 'image':
        return { src: '', alt: 'Image' };
      case 'music_player':
        return { trackId: '', showControls: true };
      case 'video':
        return { videoId: '', autoplay: false };
      case 'button':
        return { text: 'Click me', action: 'none', link: '' };
      default:
        return {};
    }
  };

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<LandingPageElement>) => {
    setPageData(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
  }, []);

  const handleElementDelete = useCallback((elementId: string) => {
    setPageData(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }));
  }, []);

  const handleSave = async () => {
    if (!selectedAlbumId || !pageData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select an album and enter a title",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = {
        album_id: selectedAlbumId,
        user_id: user?.id,
        title: pageData.title,
        elements: pageData.elements as any,
        theme: pageData.theme as any,
        is_published: pageData.is_published
      };

      if (pageData.id) {
        // Update existing
        const { error } = await supabase
          .from('album_landing_pages')
          .update(dataToSave)
          .eq('id', pageData.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('album_landing_pages')
          .insert(dataToSave)
          .select()
          .single();
        
        if (error) throw error;
        setPageData(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Success!",
        description: "Landing page saved successfully",
      });
    } catch (error) {
      console.error('Error saving landing page:', error);
      toast({
        title: "Error",
        description: "Failed to save landing page",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!pageData.id) {
      await handleSave();
    }

    try {
      const { error } = await supabase
        .from('album_landing_pages')
        .update({ is_published: !pageData.is_published })
        .eq('id', pageData.id);

      if (error) throw error;

      setPageData(prev => ({ ...prev, is_published: !prev.is_published }));
      
      toast({
        title: "Success!",
        description: `Landing page ${pageData.is_published ? 'unpublished' : 'published'} successfully`,
      });
    } catch (error) {
      console.error('Error publishing landing page:', error);
      toast({
        title: "Error",
        description: "Failed to publish landing page",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    if (selectedAlbumId) {
      const previewUrl = `/album-preview/${selectedAlbumId}`;
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Landing Page Designer</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="album-select">Select Album</Label>
              <Select value={selectedAlbumId} onValueChange={handleAlbumSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an album..." />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="page-title">Page Title</Label>
              <Input
                id="page-title"
                value={pageData.title}
                onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter page title"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handlePublish} variant="outline">
                <Palette className="h-4 w-4 mr-2" />
                {pageData.is_published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button onClick={handlePreview} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>

        {selectedAlbumId && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Element Palette */}
            <div className="lg:col-span-1">
              <ElementPalette onAddElement={handleAddElement} />
            </div>

            {/* Canvas */}
            <div className="lg:col-span-3">
              <DragDropCanvas
                elements={pageData.elements}
                theme={pageData.theme}
                onElementUpdate={handleElementUpdate}
                onElementDelete={handleElementDelete}
                albumId={selectedAlbumId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPageDesigner;
