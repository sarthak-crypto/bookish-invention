
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Music, User, Calendar, MoreVertical, Trash2, Edit, Video, CreditCard, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import QuickCreateProjectModal from '@/components/project/QuickCreateProjectModal';
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
  fancard_count?: number;
}

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

      // Then get counts for each album
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

          const { count: fancardCount } = await supabase
            .from('fan_cards')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', project.id);

          return {
            ...project,
            track_count: trackCount || 0,
            video_count: videoCount || 0,
            fancard_count: fancardCount || 0,
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            {projects.length === 0 ? 'Start by creating your first project' : `Manage your ${projects.length} project${projects.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#C87343] hover:bg-[#B5633A] text-white px-6 py-3 text-lg font-medium"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Project
        </Button>
      </div>

      {/* Workflow Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-l-4 border-[#C87343]">
        <h3 className="font-semibold mb-2 text-[#C87343]">Quick Project Setup</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-[#C87343] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
            <div>
              <p className="font-medium text-foreground">Create Project</p>
              <p>Start with just a project name - under 1 minute</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-[#C87343] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
            <div>
              <p className="font-medium text-foreground">Add Content</p>
              <p>Upload music, videos, and create FanCards</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-[#C87343] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
            <div>
              <p className="font-medium text-foreground">Launch & Share</p>
              <p>Order cards and share with your audience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="text-center py-16">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Music className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first project to get started. You can set it up in under a minute with just a name, then add content later.
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[#C87343] hover:bg-[#B5633A] text-white px-8 py-3 text-lg"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-[#C87343]/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0" onClick={() => navigate(`/projects/${project.id}`)}>
                    <CardTitle className="text-lg truncate group-hover:text-[#C87343] transition-colors">{project.title}</CardTitle>
                    {project.artist_name && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{project.artist_name}</span>
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingProject(project)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
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
                {/* Cover Image */}
                {project.artwork_url ? (
                  <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={project.artwork_url} 
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Music className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">No artwork yet</p>
                    </div>
                  </div>
                )}
                
                {/* Description */}
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <Music className="h-3 w-3 mr-1" />
                    {project.track_count} tracks
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Video className="h-3 w-3 mr-1" />
                    {project.video_count} videos
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {project.fancard_count} cards
                  </Badge>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#C87343] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="font-medium">Configure</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add Project Card */}
          <Card 
            className="border-dashed border-2 border-muted-foreground/25 hover:border-[#C87343]/50 cursor-pointer group transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-[#C87343]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#C87343]/20 transition-colors">
                <Plus className="h-8 w-8 text-[#C87343]" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-[#C87343] transition-colors">Create New Project</h3>
              <p className="text-sm text-muted-foreground">Add another project to your collection</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Create Modal */}
      <QuickCreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={handleProjectCreated}
      />

      {/* Edit Project Dialog */}
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
