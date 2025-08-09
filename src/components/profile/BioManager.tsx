
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Save, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BioData {
  header_1: string;
  header_2: string;
  content_1: string;
  content_2: string;
}

const BioManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bioData, setBioData] = useState<BioData>({
    header_1: '',
    header_2: '',
    content_1: '',
    content_2: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBioData();
    }
  }, [user]);

  const fetchBioData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_bios')
        .select('header_1, header_2, content_1, content_2')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        setBioData(data);
      }
    } catch (error) {
      console.error('Error fetching bio data:', error);
      toast({
        title: "Error",
        description: "Failed to load bio data",
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
      const { error } = await supabase
        .from('user_bios')
        .upsert({
          user_id: user.id,
          ...bioData,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client bio updated successfully!",
      });
    } catch (error) {
      console.error('Error saving bio:', error);
      toast({
        title: "Error",
        description: "Failed to save bio data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof BioData, value: string) => {
    setBioData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading bio data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Client Bio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="header1">First Section Header</Label>
              <Input
                id="header1"
                placeholder="e.g., About Me, Biography, etc."
                value={bioData.header_1}
                onChange={(e) => handleInputChange('header_1', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content1">First Section Content</Label>
              <Textarea
                id="content1"
                placeholder="Tell your story, share your background..."
                rows={6}
                value={bioData.content_1}
                onChange={(e) => handleInputChange('content_1', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="header2">Second Section Header</Label>
              <Input
                id="header2"
                placeholder="e.g., My Music, Latest Projects, etc."
                value={bioData.header_2}
                onChange={(e) => handleInputChange('header_2', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content2">Second Section Content</Label>
              <Textarea
                id="content2"
                placeholder="Share more details about your work, inspiration..."
                rows={6}
                value={bioData.content_2}
                onChange={(e) => handleInputChange('content_2', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Bio'}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Preview
          </h4>
          <div className="space-y-4 text-sm">
            {bioData.header_1 && (
              <div>
                <h5 className="font-semibold">{bioData.header_1}</h5>
                {bioData.content_1 && (
                  <p className="text-muted-foreground mt-1">{bioData.content_1}</p>
                )}
              </div>
            )}
            
            {bioData.header_2 && (
              <div>
                <h5 className="font-semibold">{bioData.header_2}</h5>
                {bioData.content_2 && (
                  <p className="text-muted-foreground mt-1">{bioData.content_2}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BioManager;
