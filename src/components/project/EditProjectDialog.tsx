
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
  artist_name?: string | null;
  artist_bio?: string | null;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onProjectUpdated: () => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  open,
  onOpenChange,
  project,
  onProjectUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    artistName: project.artist_name || '',
    artistBio: project.artist_bio || '',
  });
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      let artworkUrl = project.artwork_url;

      // Upload new artwork if provided
      if (artworkFile) {
        const artworkFileName = `${user.id}/${Date.now()}-${artworkFile.name}`;
        const { data: artworkUpload, error: artworkError } = await supabase.storage
          .from('artwork')
          .upload(artworkFileName, artworkFile);

        if (artworkError) throw artworkError;
        artworkUrl = `https://pmrqueeoojexmuuyefba.supabase.co/storage/v1/object/public/artwork/${artworkFileName}`;
      }

      // Update project
      const { error: updateError } = await supabase
        .from('albums')
        .update({
          title: formData.title,
          description: formData.description,
          artist_name: formData.artistName,
          artist_bio: formData.artistBio,
          artwork_url: artworkUrl,
        })
        .eq('id', project.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Project updated successfully.",
      });

      onProjectUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Project update error:', error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="projectTitle">Project Title</Label>
            <Input
              id="projectTitle"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="projectDescription">Description</Label>
            <Textarea
              id="projectDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
            />
          </div>

          <div>
            <Label htmlFor="artistName">Artist Name</Label>
            <Input
              id="artistName"
              value={formData.artistName}
              onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
              placeholder="Enter artist name"
            />
          </div>

          <div>
            <Label htmlFor="artistBio">Artist Bio</Label>
            <Textarea
              id="artistBio"
              value={formData.artistBio}
              onChange={(e) => setFormData(prev => ({ ...prev, artistBio: e.target.value }))}
              placeholder="Tell us about the artist"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="artworkFile">Project Artwork</Label>
            <Input
              id="artworkFile"
              type="file"
              accept="image/*"
              onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave empty to keep current artwork
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !formData.title}>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Update Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
