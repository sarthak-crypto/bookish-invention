
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, UserPlus, CreditCard, Check } from 'lucide-react';

export type CardType = 'TAP' | 'TAP TO REGISTER' | 'TAP TO PAY';

interface CardTypeOption {
  type: CardType;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

interface CardTypeSelectorProps {
  selectedType: CardType | null;
  onTypeSelect: (type: CardType) => void;
}

const cardTypes: CardTypeOption[] = [
  {
    type: 'TAP',
    title: 'TAP (Standard)',
    description: 'Redirects users to your content landing page when tapped',
    features: [
      'Direct link to your album/content',
      'Perfect for sharing music and videos',
      'Simple and effective user experience',
      'No additional setup required'
    ],
    icon: <ExternalLink className="h-5 w-5" />,
    popular: true
  },
  {
    type: 'TAP TO REGISTER',
    title: 'TAP TO REGISTER',
    description: 'Collects user email and registration information on tap',
    features: [
      'Build your fan email list',
      'Collect user contact information',
      'Great for marketing campaigns',
      'Opt-in functionality included'
    ],
    icon: <UserPlus className="h-5 w-5" />
  },
  {
    type: 'TAP TO PAY',
    title: 'TAP TO PAY',
    description: 'Triggers a payment workflow for purchases on tap',
    features: [
      'Direct payment processing',
      'Sell merchandise or content',
      'Secure Stripe integration',
      'Instant transaction capability'
    ],
    icon: <CreditCard className="h-5 w-5" />
  }
];

const CardTypeSelector: React.FC<CardTypeSelectorProps> = ({
  selectedType,
  onTypeSelect
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cardTypes.map((option) => (
        <Card
          key={option.type}
          className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedType === option.type
              ? 'ring-2 ring-primary border-primary'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => onTypeSelect(option.type)}
        >
          {option.popular && (
            <div className="absolute -top-2 left-4">
              <Badge className="bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            </div>
          )}
          
          {selectedType === option.type && (
            <div className="absolute -top-2 -right-2">
              <div className="bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            </div>
          )}

          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {option.icon}
              {option.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {option.description}
            </p>
            
            <ul className="space-y-2">
              {option.features.map((feature, index) => (
                <li key={index} className="text-xs flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Button
                variant={selectedType === option.type ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onTypeSelect(option.type);
                }}
              >
                {selectedType === option.type ? 'Selected' : 'Select'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CardTypeSelector;
