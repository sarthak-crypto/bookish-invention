
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface QuickCreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
}

const QuickCreateProjectModal: React.FC<QuickCreateProjectModalProps> = ({
  open,
  onOpenChange,
  onProjectCreated,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Create project with minimal required fields
      const { data: projectData, error: projectError } = await supabase
        .from('albums')
        .insert({
          user_id: user.id,
          title: projectName.trim(),
          description: null,
          artist_name: null,
          artist_bio: null,
          artwork_url: null,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Automatically create API key for the project
      const { error: apiKeyError } = await supabase
        .from('album_api_keys')
        .insert({
          album_id: projectData.id,
        });

      if (apiKeyError) {
        console.error('Error creating API key:', apiKeyError);
        // Don't throw error here - project creation should succeed even if API key fails
      }

      toast({
        title: "Project Created!",
        description: `"${projectName}" has been created successfully.`,
      });

      // Reset form and close modal
      setProjectName('');
      onOpenChange(false);
      
      if (onProjectCreated) {
        onProjectCreated();
      }

      // Redirect to project detail page immediately
      navigate(`/projects/${projectData.id}`);
    } catch (error) {
      console.error('Project creation error:', error);
      setError('Failed to create project. Please try again.');
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      setProjectName('');
      setError('');
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Give your project a name to get started. You can add content and details later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="e.g., Newark Tech Week 2024"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isCreating}
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !projectName.trim()}
              className="bg-[#C87343] hover:bg-[#B5633A] text-white"
            >
              {isCreating ? 'Creating...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCreateProjectModal;
