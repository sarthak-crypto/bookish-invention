
import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import DraggableElement from './DraggableElement';

interface LandingPageElement {
  id: string;
  type: 'text' | 'image' | 'music_player' | 'video' | 'button';
  position: { x: number; y: number };
  properties: Record<string, any>;
  size: { width: number; height: number };
}

interface DragDropCanvasProps {
  elements: LandingPageElement[];
  theme: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  onElementUpdate: (elementId: string, updates: Partial<LandingPageElement>) => void;
  onElementDelete: (elementId: string) => void;
  albumId: string;
}

const DragDropCanvas: React.FC<DragDropCanvasProps> = ({
  elements,
  theme,
  onElementUpdate,
  onElementDelete,
  albumId
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const handleElementClick = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElementId(null);
    }
  };

  return (
    <Card className="h-[600px] relative overflow-hidden">
      <div
        ref={canvasRef}
        className="w-full h-full p-4 relative"
        style={{ backgroundColor: theme.backgroundColor }}
        onClick={handleCanvasClick}
      >
        {elements.map((element) => (
          <DraggableElement
            key={element.id}
            element={element}
            isSelected={selectedElementId === element.id}
            onUpdate={onElementUpdate}
            onDelete={onElementDelete}
            onClick={() => handleElementClick(element.id)}
            theme={theme}
            albumId={albumId}
          />
        ))}
        
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Empty Canvas</div>
              <div className="text-sm">Drag elements from the palette to get started</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DragDropCanvas;
