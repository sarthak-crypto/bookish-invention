
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Music, Video, User, Edit, Calendar, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditProjectDialog from '@/components/project/EditProjectDialog';

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
  artist_name?: string | null;
  artist_bio?: string | null;
  created_at: string;
  user_id: string;
}

interface Track {
  id: string;
  title: string;
  duration: number | null;
  file_url: string;
}

interface Video {
  id: string;
  title: string;
  duration: number | null;
  file_url: string;
  thumbnail_url: string | null;
}

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<ProjectDetail | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchApiEndpoint();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', id)
        .order('title');

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);

      // Fetch videos for this user
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', projectData.user_id)
        .order('title');

      if (videosError) throw videosError;
      setVideos(videosData || []);

    } catch (error) {
      console.error('Error fetching project details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApiEndpoint = async () => {
    try {
      const { data: apiKeyData, error } = await supabase
        .from('album_api_keys')
        .select('api_key')
        .eq('album_id', id)
        .eq('is_active', true)
        .single();

      if (error || !apiKeyData) {
        console.log('No API key found for this project');
        return;
      }

      const endpoint = `https://pmrqueeoojexmuuyefba.supabase.co/functions/v1/album-api/${apiKeyData.api_key}`;
      setApiEndpoint(endpoint);
    } catch (error) {
      console.error('Error fetching API endpoint:', error);
    }
  };

  const handleProjectUpdated = () => {
    setEditingProject(null);
    fetchProjectDetails();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API endpoint copied to clipboard",
    });
  };

  const openInBrowser = (url: string) => {
    window.open(url, '_blank');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div>Loading project details...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Project not found</h2>
        <Button onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === project.user_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        {isOwner && (
          <Button onClick={() => setEditingProject(project)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
        )}
      </div>

      {/* Project Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {project.artwork_url && (
              <div className="w-full md:w-48 h-48 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={project.artwork_url} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                {project.artist_name && (
                  <div className="flex items-center gap-2 text-lg text-muted-foreground mb-2">
                    <User className="h-4 w-4" />
                    <span>{project.artist_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {project.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
              )}

              {project.artist_bio && (
                <div>
                  <h3 className="font-semibold mb-2">Artist Bio</h3>
                  <p className="text-muted-foreground">{project.artist_bio}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Badge variant="secondary">
                  <Music className="h-3 w-3 mr-1" />
                  {tracks.length} tracks
                </Badge>
                <Badge variant="secondary">
                  <Video className="h-3 w-3 mr-1" />
                  {videos.length} videos
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoint */}
      {apiEndpoint && isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              API Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your project API endpoint for external access:
            </p>
            
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {apiEndpoint}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(apiEndpoint)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openInBrowser(apiEndpoint)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracks */}
      {tracks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Tracks ({tracks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">{track.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Duration: {formatDuration(track.duration)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={track.file_url} target="_blank" rel="noopener noreferrer">
                      Play
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Videos ({videos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="bg-muted rounded-lg overflow-hidden">
                  {video.thumbnail_url && (
                    <div className="aspect-video bg-black">
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-medium mb-1">{video.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Duration: {formatDuration(video.duration)}
                    </p>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <a href={video.file_url} target="_blank" rel="noopener noreferrer">
                        Watch
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {tracks.length === 0 && videos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
            <p className="text-muted-foreground">
              This project doesn't have any tracks or videos yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingProject && (
        <EditProjectDialog
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          project={editingProject}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;
