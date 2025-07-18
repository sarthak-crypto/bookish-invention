import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BioData {
  id?: string;
  header_1: string;
  header_2: string;
  content_1: string;
  content_2: string;
  user_id: string;
}

const BioManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bioData, setBioData] = useState<BioData>({
    header_1: '',
    header_2: '',
    content_1: '',
    content_2: '',
    user_id: user?.id || ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBioData();
    }
  }, [user]);

  const fetchBioData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_bios')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      
      if (data) {
        setBioData(data);
      }
    } catch (error) {
      console.error('Error fetching bio data:', error);
      toast({
        title: "Error",
        description: "Failed to load bio data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const dataToSave = {
        ...bioData,
        user_id: user.id
      };

      if (bioData.id) {
        // Update existing bio
        const { error } = await supabase
          .from('user_bios')
          .update(dataToSave)
          .eq('id', bioData.id);

        if (error) throw error;
      } else {
        // Insert new bio
        const { data, error } = await supabase
          .from('user_bios')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        setBioData(data);
      }

      toast({
        title: "Success",
        description: "Bio information saved successfully!",
      });
    } catch (error) {
      console.error('Error saving bio data:', error);
      toast({
        title: "Error",
        description: "Failed to save bio information.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof BioData, value: string) => {
    setBioData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading bio information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Bio Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="header-1">Custom Header 1</Label>
            <Input
              id="header-1"
              value={bioData.header_1}
              onChange={(e) => handleInputChange('header_1', e.target.value)}
              placeholder="Enter your first custom header"
            />
          </div>

          <div>
            <Label htmlFor="content-1">Content Area 1</Label>
            <Textarea
              id="content-1"
              value={bioData.content_1}
              onChange={(e) => handleInputChange('content_1', e.target.value)}
              placeholder="Enter your first content area text"
              rows={6}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Rich text editing with basic formatting support
            </p>
          </div>

          <div>
            <Label htmlFor="header-2">Custom Header 2</Label>
            <Input
              id="header-2"
              value={bioData.header_2}
              onChange={(e) => handleInputChange('header_2', e.target.value)}
              placeholder="Enter your second custom header"
            />
          </div>

          <div>
            <Label htmlFor="content-2">Content Area 2</Label>
            <Textarea
              id="content-2"
              value={bioData.content_2}
              onChange={(e) => handleInputChange('content_2', e.target.value)}
              placeholder="Enter your second content area text"
              rows={6}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Rich text editing with basic formatting support
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Bio Information'}
          </Button>
        </div>

        {/* Bio Preview */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Bio Preview</h3>
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            {bioData.header_1 && (
              <div>
                <h4 className="font-medium text-lg">{bioData.header_1}</h4>
                {bioData.content_1 && (
                  <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                    {bioData.content_1}
                  </p>
                )}
              </div>
            )}
            
            {bioData.header_2 && (
              <div>
                <h4 className="font-medium text-lg">{bioData.header_2}</h4>
                {bioData.content_2 && (
                  <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                    {bioData.content_2}
                  </p>
                )}
              </div>
            )}
            
            {!bioData.header_1 && !bioData.header_2 && (
              <p className="text-muted-foreground text-center">
                Your bio preview will appear here as you type
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BioManager;