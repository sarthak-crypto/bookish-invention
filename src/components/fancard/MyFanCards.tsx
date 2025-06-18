
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

interface FanCard {
  id: string;
  album_id: string;
  artwork_url: string;
  price: number;
  description: string | null;
  created_at: string;
  albums?: {
    title: string;
  } | null;
}

const MyFanCards: React.FC = () => {
  const { user } = useAuth();
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
                  <p className="font-bold text-foreground-dark">
                    ${card.price.toFixed(2)}
                  </p>
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
