import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Copy, Share2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PublicProfileLink: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/artist/${user?.id}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Public profile URL copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my music profile',
          text: 'Listen to my latest albums and tracks!',
          url: publicUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const openInNewTab = () => {
    window.open(publicUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Public Profile Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Share this URL with your fans so they can discover your music, albums, and bio. 
            This is your public artist profile that anyone can access.
          </p>
          
          <div className="flex gap-2">
            <Input
              value={publicUrl}
              readOnly
              className="font-mono text-sm"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              <Copy className={`h-4 w-4 ${copied ? 'text-green-600' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={shareProfile}
            className="flex items-center gap-2 flex-1"
          >
            <Share2 className="h-4 w-4" />
            Share Profile
          </Button>
          
          <Button
            variant="outline"
            onClick={openInNewTab}
            className="flex items-center gap-2 flex-1"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </Button>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            What your fans will see:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your artist name and bio information</li>
            <li>• All your published albums with artwork</li>
            <li>• Track listings for each album</li>
            <li>• Artist stats and information</li>
            <li>• Mobile-friendly responsive design</li>
          </ul>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> Only published content will be visible to the public. 
            Your profile information and albums are automatically shared through this link.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicProfileLink;