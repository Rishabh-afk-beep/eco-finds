import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { store } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Leaf, DollarSign, Sparkles, ChevronRight } from 'lucide-react';

interface EcoOnboardingProps {
  onComplete: () => void;
}

const ecoIdentities = [
  {
    id: 'save-money' as const,
    title: 'Save Money',
    icon: DollarSign,
    description: 'Find amazing deals and stretch your budget further',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    benefits: ['Up to 70% off retail prices', 'Budget-friendly options', 'Smart spending choices']
  },
  {
    id: 'reduce-waste' as const,
    title: 'Reduce Waste',
    icon: Leaf,
    description: 'Make a positive impact on our planet',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    benefits: ['Prevent items from landfills', 'Reduce carbon footprint', 'Support circular economy']
  },
  {
    id: 'find-unique' as const,
    title: 'Find Unique Items',
    icon: Sparkles,
    description: 'Discover one-of-a-kind treasures',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    benefits: ['Vintage and rare finds', 'Unique character pieces', 'Express your style']
  }
];

export function EcoOnboarding({ onComplete }: EcoOnboardingProps) {
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const handleIdentitySelect = (identityId: string) => {
    setSelectedIdentity(identityId);
  };

  const handleContinue = () => {
    if (!selectedIdentity) return;
    
    if (step === 1) {
      setStep(2);
    } else {
      // Complete onboarding
      store.updateUser({
        ecoIdentity: selectedIdentity as any,
        onboarded: true
      });
      
      toast({
        title: "Welcome to EcoFinds! 🌱",
        description: "Your eco journey starts now. Let's make a difference together!",
        duration: 4000
      });
      
      onComplete();
    }
  };

  const selectedEcoIdentity = ecoIdentities.find(identity => identity.id === selectedIdentity);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {step === 1 ? (
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">Welcome to EcoFinds! 🌍</CardTitle>
              <p className="text-muted-foreground">
                Help us personalize your experience. What matters most to you?
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {ecoIdentities.map((identity) => {
                  const Icon = identity.icon;
                  const isSelected = selectedIdentity === identity.id;
                  
                  return (
                    <Card 
                      key={identity.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                        isSelected 
                          ? 'ring-2 ring-primary shadow-lg scale-105' 
                          : 'hover:scale-102'
                      }`}
                      onClick={() => handleIdentitySelect(identity.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${identity.bgColor}`}>
                            <Icon className={`h-6 w-6 ${identity.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg flex items-center">
                              {identity.title}
                              {isSelected && (
                                <Badge variant="default" className="ml-2">
                                  Selected
                                </Badge>
                              )}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {identity.description}
                            </p>
                          </div>
                          <ChevronRight className={`h-5 w-5 transition-transform ${
                            isSelected ? 'rotate-90 text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleContinue}
                  disabled={!selectedIdentity}
                  size="lg"
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {selectedEcoIdentity && (
                  <div className={`h-16 w-16 rounded-full ${selectedEcoIdentity.bgColor} flex items-center justify-center`}>
                    <selectedEcoIdentity.icon className={`h-8 w-8 ${selectedEcoIdentity.color}`} />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">Perfect Choice!</CardTitle>
              <p className="text-muted-foreground">
                You chose <strong>{selectedEcoIdentity?.title}</strong>. Here's what you can expect:
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedEcoIdentity && (
                <div className="space-y-3">
                  {selectedEcoIdentity.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full ${selectedEcoIdentity.color.replace('text-', 'bg-')}`} />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Your EcoFinds Dashboard will show:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Personalized product recommendations</p>
                  <p>• Your environmental impact tracking</p>
                  <p>• Community achievements and milestones</p>
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleContinue}
                  size="lg"
                >
                  Start My Eco Journey! 🌱
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}