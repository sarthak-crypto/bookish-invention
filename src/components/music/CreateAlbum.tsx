
import React from 'react';
import CreateProjectForm from '@/components/project/CreateProjectForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music } from 'lucide-react';

const CreateAlbum: React.FC = () => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground-dark">
          <Music className="h-6 w-6 text-primary" />
          Create New Album
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CreateProjectForm />
      </CardContent>
    </Card>
  );
};

export default CreateAlbum;
