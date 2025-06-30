
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Type, Image, Music, Video, MousePointer } from 'lucide-react';

interface ElementPaletteProps {
  onAddElement: (elementType: string) => void;
}

const ElementPalette: React.FC<ElementPaletteProps> = ({ onAddElement }) => {
  const elements = [
    {
      type: 'text',
      icon: Type,
      label: 'Text',
      description: 'Add text content'
    },
    {
      type: 'image',
      icon: Image,
      label: 'Image',
      description: 'Add images'
    },
    {
      type: 'music_player',
      icon: Music,
      label: 'Music Player',
      description: 'Add music player'
    },
    {
      type: 'video',
      icon: Video,
      label: 'Video',
      description: 'Add video content'
    },
    {
      type: 'button',
      icon: MousePointer,
      label: 'Button',
      description: 'Add interactive button'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {elements.map((element) => {
          const IconComponent = element.icon;
          return (
            <Button
              key={element.type}
              variant="outline"
              className="w-full justify-start h-auto p-3"
              onClick={() => onAddElement(element.type)}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{element.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {element.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ElementPalette;
