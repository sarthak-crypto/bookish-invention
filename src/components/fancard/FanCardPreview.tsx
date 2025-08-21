
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package } from 'lucide-react';

interface FanCard {
  id: string;
  artwork_url: string;
  quantity: number;
  description: string | null;
  created_at: string;
  status: string;
  purchased: boolean;
  albums?: {
    title: string;
  };
}

interface FanCardPreviewProps {
  fanCard: FanCard;
}

const FanCardPreview: React.FC<FanCardPreviewProps> = ({ fanCard }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isPending = fanCard.status === 'pending' || fanCard.purchased;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Fan Card Preview</span>
          <Badge className={getStatusColor(fanCard.status)}>
            {fanCard.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Image */}
          <div className="space-y-4">
            <div 
              className={`relative aspect-[2.361/3.611] bg-muted rounded-lg overflow-hidden shadow-lg ${
                isPending ? 'grayscale' : ''
              }`}
            >
              <img
                src={fanCard.artwork_url}
                alt="Fan card artwork"
                className="w-full h-full object-cover transition-all duration-300"
              />
              {isPending && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-black/60 text-white px-3 py-1 rounded-md text-sm font-medium">
                    Pending Approval
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Actual size: 2.361" × 3.611" (credit card size)
            </p>
          </div>

          {/* Card Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {fanCard.albums?.title || 'Untitled Project'} - Fan Card
              </h3>
              {fanCard.description && (
                <p className="text-muted-foreground">{fanCard.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Quantity:</strong> {fanCard.quantity} cards
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Created:</strong> {new Date(fanCard.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Card Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Premium NFC-enabled plastic card</li>
                <li>• High-quality artwork printing</li>
                <li>• Tap-to-interact functionality</li>
                <li>• Durable and water-resistant</li>
                <li>• Works with all NFC-enabled devices</li>
              </ul>
            </div>

            {isPending && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This card is currently being processed by Tapyoca Support. 
                  The image appears in grayscale until approval and shipping is complete.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FanCardPreview;
