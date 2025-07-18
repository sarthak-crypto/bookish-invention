import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, Link, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialMediaLink {
  id?: string;
  platform: string;
  url: string;
  display_text: string;
  display_order: number;
  is_active: boolean;
  user_id: string;
}

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'bandcamp', label: 'Bandcamp' },
  { value: 'website', label: 'Website' },
  { value: 'custom', label: 'Custom' }
];

const SocialMediaManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSocialMediaLinks();
    }
  }, [user]);

  const fetchSocialMediaLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .eq('user_id', user?.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching social media links:', error);
      toast({
        title: "Error",
        description: "Failed to load social media links.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewLink = () => {
    const newLink: SocialMediaLink = {
      platform: 'instagram',
      url: '',
      display_text: '',
      display_order: links.length,
      is_active: true,
      user_id: user?.id || ''
    };
    setLinks([...links, newLink]);
  };

  const removeLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    // Update display order
    const reorderedLinks = updatedLinks.map((link, i) => ({
      ...link,
      display_order: i
    }));
    setLinks(reorderedLinks);
  };

  const updateLink = (index: number, field: keyof SocialMediaLink, value: string | boolean | number) => {
    const updatedLinks = [...links];
    updatedLinks[index] = {
      ...updatedLinks[index],
      [field]: value
    };
    setLinks(updatedLinks);
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === links.length - 1)
    ) {
      return;
    }

    const updatedLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the links
    [updatedLinks[index], updatedLinks[targetIndex]] = [updatedLinks[targetIndex], updatedLinks[index]];
    
    // Update display order
    updatedLinks.forEach((link, i) => {
      link.display_order = i;
    });

    setLinks(updatedLinks);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Delete existing links that are not in the current list
      const existingIds = links.filter(link => link.id).map(link => link.id);
      
      if (existingIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('social_media_links')
          .delete()
          .eq('user_id', user.id)
          .not('id', 'in', `(${existingIds.join(',')})`);

        if (deleteError) throw deleteError;
      } else {
        // Delete all existing links if no IDs present
        const { error: deleteAllError } = await supabase
          .from('social_media_links')
          .delete()
          .eq('user_id', user.id);

        if (deleteAllError) throw deleteAllError;
      }

      // Process each link
      for (const link of links) {
        if (!link.url || !link.display_text) continue;

        const linkData = {
          platform: link.platform,
          url: link.url,
          display_text: link.display_text,
          display_order: link.display_order,
          is_active: link.is_active,
          user_id: user.id
        };

        if (link.id) {
          // Update existing link
          const { error } = await supabase
            .from('social_media_links')
            .update(linkData)
            .eq('id', link.id);

          if (error) throw error;
        } else {
          // Insert new link
          const { error } = await supabase
            .from('social_media_links')
            .insert(linkData);

          if (error) throw error;
        }
      }

      await fetchSocialMediaLinks(); // Refresh the data

      toast({
        title: "Success",
        description: "Social media links saved successfully!",
      });
    } catch (error) {
      console.error('Error saving social media links:', error);
      toast({
        title: "Error",
        description: "Failed to save social media links.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading social media links...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Social Media Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {links.map((link, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Link {index + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveLink(index, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveLink(index, 'down')}
                    disabled={index === links.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <Select
                    value={link.platform}
                    onValueChange={(value) => updateLink(index, 'platform', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Display Text</Label>
                  <Input
                    value={link.display_text}
                    onChange={(e) => updateLink(index, 'display_text', e.target.value)}
                    placeholder="e.g., Follow me on Instagram"
                  />
                </div>
              </div>

              <div>
                <Label>URL</Label>
                <Input
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={link.is_active}
                  onCheckedChange={(checked) => updateLink(index, 'is_active', checked)}
                />
                <Label>Active (visible to public)</Label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={addNewLink}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Social Media Link
          </Button>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Links'}
          </Button>
        </div>

        {/* Preview */}
        {links.filter(link => link.is_active && link.url && link.display_text).length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              {links
                .filter(link => link.is_active && link.url && link.display_text)
                .map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{link.platform}:</span>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {link.display_text}
                    </a>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaManager;