
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, Key, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  album_id: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  usage_count: number;
  album_title: string;
}

const AlbumApiKeys: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [albums, setAlbums] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchApiKeys();
      fetchAlbums();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('album_api_keys')
        .select(`
          *,
          albums!inner(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const keysWithTitles = data.map(item => ({
        ...item,
        album_title: item.albums.title
      }));

      setApiKeys(keysWithTitles);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('id, title')
        .eq('user_id', user?.id)
        .order('title');

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const generateApiKey = async (albumId: string) => {
    try {
      const { error } = await supabase
        .from('album_api_keys')
        .insert({
          album_id: albumId,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "API key generated successfully",
      });

      fetchApiKeys();
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('album_api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `API key ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchApiKeys();
    } catch (error) {
      console.error('Error updating API key:', error);
      toast({
        title: "Error",
        description: "Failed to update API key status",
        variant: "destructive",
      });
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('album_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "API key deleted successfully",
      });

      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading API keys...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Album API Keys
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Generate New API Key</h3>
          <div className="flex gap-2">
            {albums.map((album) => (
              <Button
                key={album.id}
                variant="outline"
                size="sm"
                onClick={() => generateApiKey(album.id)}
                disabled={apiKeys.some(key => key.album_id === album.id && key.is_active)}
              >
                {album.title}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{apiKey.album_title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(apiKey.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                    {apiKey.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleKeyStatus(apiKey.id, apiKey.is_active)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteApiKey(apiKey.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1">
                  {visibleKeys.has(apiKey.id) ? apiKey.api_key : '••••••••••••••••••••••••••••••••'}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleKeyVisibility(apiKey.id)}
                >
                  {visibleKeys.has(apiKey.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(apiKey.api_key)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Usage: {apiKey.usage_count} calls
                {apiKey.last_used_at && (
                  <span> • Last used: {new Date(apiKey.last_used_at).toLocaleString()}</span>
                )}
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <strong>API Endpoint:</strong> https://pmrqueeoojexmuuyefba.supabase.co/functions/v1/album-api/{apiKey.api_key}
              </div>
            </div>
          ))}
        </div>

        {apiKeys.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No API keys generated yet. Create one for your albums above.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AlbumApiKeys;
