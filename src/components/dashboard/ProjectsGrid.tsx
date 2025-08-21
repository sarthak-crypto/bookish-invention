
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Calendar, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
  created_at: string;
  user_id: string;
  artist_name?: string | null;
  track_count?: number;
}

const ProjectsGrid: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(6); // Show only 6 projects on dashboard

      if (albumsError) throw albumsError;

      // Get track counts for each album
      const projectsWithCounts = await Promise.all(
        (albumsData || []).map(async (project) => {
          const { count: trackCount } = await supabase
            .from('tracks')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', project.id);

          return {
            ...project,
            track_count: trackCount || 0,
          };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-square bg-muted rounded-lg mb-3"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first project to get started with organizing your music.
        </p>
        <Button 
          onClick={() => navigate('/projects')} 
          className="bg-[#C87343] hover:bg-[#B5633A] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create First Project
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card 
          key={project.id} 
          className="group hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-[#C87343]/20"
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          <CardContent className="p-4">
            {/* Cover Image */}
            {project.artwork_url ? (
              <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                <img 
                  src={project.artwork_url} 
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            {/* Title */}
            <h3 className="font-semibold truncate group-hover:text-[#C87343] transition-colors mb-1">
              {project.title}
            </h3>
            
            {/* Description */}
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {project.description}
              </p>
            )}
            
            {/* Stats and Date */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                <Music className="h-3 w-3 mr-1" />
                {project.track_count} tracks
              </Badge>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Hover indicator */}
            <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-[#C87343] font-medium">Open project</span>
              <ArrowRight className="h-3 w-3 ml-1 text-[#C87343]" />
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Show more projects card if there are more than 6 */}
      {projects.length === 6 && (
        <Card 
          className="border-dashed border-2 border-muted-foreground/25 hover:border-[#C87343]/50 cursor-pointer group transition-colors"
          onClick={() => navigate('/projects')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center aspect-square text-center">
            <div className="w-12 h-12 bg-[#C87343]/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#C87343]/20 transition-colors">
              <ArrowRight className="h-6 w-6 text-[#C87343]" />
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-[#C87343] transition-colors">View All Projects</h3>
            <p className="text-sm text-muted-foreground">See your complete project collection</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectsGrid;
