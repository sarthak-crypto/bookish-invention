import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Album, ArrowLeft, Edit, Eye, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateAlbum from '@/components/music/CreateAlbum';
import AlbumManager from '@/components/music/AlbumManager';

interface AlbumData {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
  created_at: string;
  track_count: number;
  api_endpoint: string | null;
}

const AlbumsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [albums, setAlbums] = useState<AlbumData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAlbums();
    }
  }, [user]);

  const fetchAlbums = async () => {
    try {
      // Fetch albums with track count and API endpoint
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (albumsError) throw albumsError;

      // Fetch track counts for each album
      const albumsWithCounts = await Promise.all(
        (albumsData || []).map(async (album) => {
          const { count } = await supabase
            .from('tracks')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', album.id);

          // Fetch API endpoint
          const { data: apiData } = await supabase
            .from('album_api_keys')
            .select('api_key')
            .eq('album_id', album.id)
            .eq('is_active', true)
            .maybeSingle();

          const apiEndpoint = apiData?.api_key 
            ? `https://pmrqueeoojexmuuyefba.supabase.co/functions/v1/album-api/${apiData.api_key}`
            : null;

          return {
            ...album,
            track_count: count || 0,
            api_endpoint: apiEndpoint
          };
        })
      );

      setAlbums(albumsWithCounts);
    } catch (error) {
      console.error('Error fetching albums:', error);
      toast({
        title: "Error",
        description: "Failed to fetch albums",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAlbum = async (albumId: string) => {
    if (!confirm('Are you sure you want to delete this album? This will also delete all associated tracks and API keys.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album deleted successfully",
      });

      fetchAlbums();
    } catch (error) {
      console.error('Error deleting album:', error);
      toast({
        title: "Error",
        description: "Failed to delete album",
        variant: "destructive",
      });
    }
  };

  const copyApiEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint);
    toast({
      title: "Copied!",
      description: "API endpoint copied to clipboard",
    });
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        Loading albums...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-foreground-dark flex items-center gap-3">
            <Album className="h-8 w-8" />
            Albums Management
          </h1>
        </div>
      </header>

      <div className="container mx-auto">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="create">Create Album</TabsTrigger>
            <TabsTrigger value="manage">Manage Tracks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Albums ({albums.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {albums.length === 0 ? (
                  <div className="text-center py-8">
                    <Album className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No albums created yet</p>
                    <Button onClick={() => navigate('/albums?tab=create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Album
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Artwork</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Tracks</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>API Access</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {albums.map((album) => (
                        <TableRow key={album.id}>
                          <TableCell>
                            {album.artwork_url ? (
                              <img 
                                src={album.artwork_url} 
                                alt={album.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                <Album className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{album.title}</p>
                              {album.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {album.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {album.track_count} tracks
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(album.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {album.api_endpoint ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Active</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyApiEndpoint(album.api_endpoint!)}
                                >
                                  Copy URL
                                </Button>
                              </div>
                            ) : (
                              <Badge variant="outline">No API</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {album.api_endpoint && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(album.api_endpoint!, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/album-preview/${album.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAlbum(album.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <CreateAlbum />
          </TabsContent>

          <TabsContent value="manage">
            <AlbumManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AlbumsPage;