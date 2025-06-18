
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Palette, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CardDesign {
  id: string;
  name: string;
  description: string | null;
  design_data: any;
  preview_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

const CardDesignManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [designs, setDesigns] = useState<CardDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<CardDesign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderStyle: 'solid',
    borderColor: '#000000',
    isActive: true
  });

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('card_designs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch card designs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const designData = {
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        borderStyle: formData.borderStyle,
        borderColor: formData.borderColor
      };

      if (editingDesign) {
        const { error } = await supabase
          .from('card_designs')
          .update({
            name: formData.name,
            description: formData.description,
            design_data: designData,
            is_active: formData.isActive
          })
          .eq('id', editingDesign.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Card design updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('card_designs')
          .insert({
            name: formData.name,
            description: formData.description,
            design_data: designData,
            is_active: formData.isActive,
            created_by: user.id
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Card design created successfully",
        });
      }

      setFormData({
        name: '',
        description: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderStyle: 'solid',
        borderColor: '#000000',
        isActive: true
      });
      setShowCreateForm(false);
      setEditingDesign(null);
      fetchDesigns();
    } catch (error) {
      console.error('Error saving design:', error);
      toast({
        title: "Error",
        description: "Failed to save card design",
        variant: "destructive",
      });
    }
  };

  const deleteDesign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('card_designs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Card design deleted successfully",
      });
      fetchDesigns();
    } catch (error) {
      console.error('Error deleting design:', error);
      toast({
        title: "Error",
        description: "Failed to delete card design",
        variant: "destructive",
      });
    }
  };

  const startEdit = (design: CardDesign) => {
    setEditingDesign(design);
    setFormData({
      name: design.name,
      description: design.description || '',
      backgroundColor: design.design_data.backgroundColor || '#ffffff',
      textColor: design.design_data.textColor || '#000000',
      borderStyle: design.design_data.borderStyle || 'solid',
      borderColor: design.design_data.borderColor || '#000000',
      isActive: design.is_active
    });
    setShowCreateForm(true);
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading card designs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Card Design Manager
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Design
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <Card className="mb-6 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  {editingDesign ? 'Edit' : 'Create'} Card Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Design Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backgroundColor" className="text-white">Background Color</Label>
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                        className="bg-white/10 border-white/20 h-12"
                      />
                    </div>

                    <div>
                      <Label htmlFor="textColor" className="text-white">Text Color</Label>
                      <Input
                        id="textColor"
                        type="color"
                        value={formData.textColor}
                        onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                        className="bg-white/10 border-white/20 h-12"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                    />
                    <Label htmlFor="isActive" className="text-white">Active</Label>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      {editingDesign ? 'Update' : 'Create'} Design
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingDesign(null);
                        setFormData({
                          name: '',
                          description: '',
                          backgroundColor: '#ffffff',
                          textColor: '#000000',
                          borderStyle: 'solid',
                          borderColor: '#000000',
                          isActive: true
                        });
                      }}
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {designs.map((design) => (
              <Card key={design.id} className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center justify-between">
                    {design.name}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => startEdit(design)}
                        className="bg-blue-600/20 text-blue-200 hover:bg-blue-600/30"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => deleteDesign(design.id)}
                        className="bg-red-600/20 text-red-200 hover:bg-red-600/30"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="w-full h-24 rounded mb-3 border-2"
                    style={{
                      backgroundColor: design.design_data.backgroundColor,
                      borderColor: design.design_data.borderColor,
                      borderStyle: design.design_data.borderStyle
                    }}
                  >
                    <div
                      className="p-2 text-center"
                      style={{ color: design.design_data.textColor }}
                    >
                      Sample Card
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs mb-2">{design.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${design.is_active ? 'bg-green-600/20 text-green-200' : 'bg-gray-600/20 text-gray-200'}`}>
                      {design.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(design.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {designs.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No card designs found. Create your first design!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardDesignManager;
