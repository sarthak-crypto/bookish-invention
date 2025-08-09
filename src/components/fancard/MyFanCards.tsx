
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FanCard {
  id: string;
  album_id: string;
  artwork_url: string;
  quantity: number;
  description: string | null;
  created_at: string;
  albums?: {
    title: string;
  } | null;
}

const MyFanCards: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fanCards, setFanCards] = useState<FanCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFanCards();
    }
  }, [user]);

  const fetchFanCards = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_cards')
        .select(`
          *,
          albums (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFanCards(data || []);
    } catch (error) {
      console.error('Error fetching fan cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this fan card?')) return;

    try {
      const { error } = await supabase
        .from('fan_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user?.id); // Ensure user can only delete their own cards

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Fan card deleted successfully.",
      });

      fetchFanCards(); // Refresh the list
    } catch (error) {
      console.error('Error deleting fan card:', error);
      toast({
        title: "Error",
        description: "Failed to delete fan card. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading your fan cards...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          My Fan Cards
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fanCards.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No fan cards created yet. Create your first fan card to engage with your fans!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fanCards.map((card) => (
              <div key={card.id} className="border rounded-lg overflow-hidden">
                <img
                  src={card.artwork_url}
                  alt={`Fan card for ${card.albums?.title}`}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <p className="font-medium">{card.albums?.title} Fan Card</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {card.description || "No description"}
                  </p>
                  <p className="font-bold text-primary mb-3">
                    Quantity: {card.quantity}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(card.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyFanCards;
