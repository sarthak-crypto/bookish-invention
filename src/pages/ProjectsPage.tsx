
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Music, User, Calendar, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import CreateProjectForm from '@/components/project/CreateProjectForm';
import EditProjectDialog from '@/components/project/EditProjectDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
  created_at: string;
  user_id: string;
  artist_name?: string | null;
  artist_bio?: string | null;
  track_count?: number;
  video_count?: number;
}

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      // First get the albums
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (albumsError) throw albumsError;

      // Then get track counts for each album
      const projectsWithCounts = await Promise.all(
        (albumsData || []).map(async (project) => {
          const { count: trackCount } = await supabase
            .from('tracks')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', project.id);

          const { count: videoCount } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', project.user_id);

          return {
            ...project,
            track_count: trackCount || 0,
            video_count: videoCount || 0,
          };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    setShowCreateForm(false);
    fetchProjects();
  };

  const handleProjectUpdated = () => {
    setEditingProject(null);
    fetchProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Project deleted successfully",
      });

      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading projects...</div>;
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Back to Projects
          </Button>
        </div>
        <CreateProjectForm onProjectCreated={handleProjectCreated} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to get started with sharing your music and videos.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                    {project.artist_name && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{project.artist_name}</span>
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingProject(project)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0" onClick={() => navigate(`/projects/${project.id}`)}>
                {project.artwork_url && (
                  <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                    <img 
                      src={project.artwork_url} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {project.artist_bio && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                    {project.artist_bio}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">
                    {project.track_count} tracks
                  </Badge>
                  <Badge variant="secondary">
                    {project.video_count} videos
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

export default ProjectsPage;
