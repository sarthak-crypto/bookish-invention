import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image, Edit, Trash2, Upload, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageFile {
  id: string;
  title: string;
  file_url: string;
  label?: string;
  created_at: string;
}

const ImageManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<ImageFile | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newLabel, setNewLabel] = useState('');
  
  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadLabel, setUploadLabel] = useState('');

  useEffect(() => {
    if (user) {
      fetchImages();
    }
  }, [user]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error",
        description: "Failed to load your images.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !uploadTitle || !user) return;

    setUploading(true);
    try {
      // Upload image file
      const imageFileName = `${user.id}/${Date.now()}_${imageFile.name}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('artwork')
        .upload(imageFileName, imageFile);

      if (imageError) throw imageError;

      // Get image file URL
      const { data: { publicUrl } } = supabase.storage
        .from('artwork')
        .getPublicUrl(imageData.path);

      // Save image metadata to database
      const { error: dbError } = await supabase
        .from('images')
        .insert({
          user_id: user.id,
          title: uploadTitle,
          file_url: publicUrl,
          label: uploadLabel || null
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });

      // Reset form and close dialog
      setImageFile(null);
      setUploadTitle('');
      setUploadLabel('');
      setUploadDialogOpen(false);
      
      // Refresh images list
      fetchImages();

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (image: ImageFile) => {
    setEditingImage(image);
    setNewTitle(image.title);
    setNewLabel(image.label || '');
  };

  const handleSaveEdit = async () => {
    if (!editingImage || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('images')
        .update({ 
          title: newTitle.trim(),
          label: newLabel.trim() || null
        })
        .eq('id', editingImage.id);

      if (error) throw error;

      setImages(images.map(img => 
        img.id === editingImage.id ? { 
          ...img, 
          title: newTitle.trim(),
          label: newLabel.trim() || undefined
        } : img
      ));

      setEditingImage(null);
      setNewTitle('');
      setNewLabel('');

      toast({
        title: "Success",
        description: "Image updated successfully.",
      });
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Error",
        description: "Failed to update image.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
    setNewTitle('');
    setNewLabel('');
  };

  const handleDelete = async (image: ImageFile) => {
    if (!confirm(`Are you sure you want to delete "${image.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;

      setImages(images.filter(img => img.id !== image.id));

      toast({
        title: "Success",
        description: "Image deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading your images...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              My Images ({images.length} images)
            </CardTitle>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No images uploaded yet. Upload your first image to get started!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <img 
                      src={image.file_url} 
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    {editingImage && editingImage.id === image.id ? (
                      <div className="space-y-2">
                        <Input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Image title"
                          className="text-sm"
                        />
                        <Input
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          placeholder="Image label (optional)"
                          className="text-sm"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium truncate">{image.title}</p>
                        {image.label && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {image.label}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(image.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(image)}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(image)}
                            className="flex-1"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Image Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Upload Image
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleImageUpload} className="space-y-4">
            <div>
              <Label htmlFor="upload-title">Image Title</Label>
              <Input
                id="upload-title"
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Enter image title"
                required
              />
            </div>

            <div>
              <Label htmlFor="upload-label">Image Label (Optional)</Label>
              <Input
                id="upload-label"
                type="text"
                value={uploadLabel}
                onChange={(e) => setUploadLabel(e.target.value)}
                placeholder="Enter image label"
              />
            </div>

            <div>
              <Label htmlFor="image-file">Image File</Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <Button type="submit" disabled={uploading || !imageFile || !uploadTitle} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageManager;