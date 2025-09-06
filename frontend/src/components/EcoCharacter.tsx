import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { store } from '@/lib/store';
import { Leaf, Heart, Star, Sparkles } from 'lucide-react';

interface EcoCharacterProps {
  className?: string;
}

const characters = [
  {
    name: "Eco Eddie",
    emoji: "🌱",
    personality: "save-money",
    messages: [
      "Great find! This could save you some serious cash! 💰",
      "Smart shopping = more money in your pocket! 🤑",
      "You're getting amazing value AND helping the planet! 📈"
    ]
  },
  {
    name: "Green Gaia",
    emoji: "🌍", 
    personality: "reduce-waste",
    messages: [
      "Every purchase saves the planet a little more! 🌿",
      "You're preventing waste from going to landfills! ♻️",
      "Mother Earth thanks you for this eco-choice! 🌳"
    ]
  },
  {
    name: "Unique Una",
    emoji: "✨",
    personality: "find-unique", 
    messages: [
      "What a unique treasure you've discovered! 💎",
      "This vintage find has so much character! 🎨",
      "One person's treasure is your unique style! 🌟"
    ]
  }
];

export function EcoCharacter({ className }: EcoCharacterProps) {
  const [currentCharacter, setCurrentCharacter] = useState(characters[0]);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const user = store.getCurrentUser();
    if (user?.ecoIdentity) {
      const character = characters.find(c => c.personality === user.ecoIdentity) || characters[0];
      setCurrentCharacter(character);
    }
  }, []);

  useEffect(() => {
    // Show character periodically with different messages
    const interval = setInterval(() => {
      setIsVisible(true);
      setCurrentMessage(prev => (prev + 1) % currentCharacter.messages.length);
      
      setTimeout(() => {
        setIsVisible(false);
      }, 2000); // Visible for 2 seconds
    }, 20000); // Every 20 seconds

    // Show immediately on mount
    setTimeout(() => setIsVisible(true), 1000);

    return () => clearInterval(interval);
  }, [currentCharacter]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-20 right-4 z-40 animate-fade-in ${className}`}>
      <Card className="max-w-xs bg-gradient-to-r from-primary/10 via-background to-success/10 border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="text-3xl animate-bounce">
              {currentCharacter.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {currentCharacter.name}
                </Badge>
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {currentCharacter.messages[currentMessage]}
              </p>
            </div>
          </div>
          
          {/* Character animations */}
          <div className="flex justify-center mt-3 space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Floating eco particles animation
export function EcoParticles() {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    icon: ['🌱', '♻️', '🌍', '💚', '🌿', '✨'][i],
    delay: i * 0.5,
    duration: 3 + (i % 3)
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-float"
          style={{
            left: `${10 + (particle.id * 15)}%`,
            top: `${20 + (particle.id % 2) * 40}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        >
          <span className="text-2xl opacity-20">
            {particle.icon}
          </span>
        </div>
      ))}
    </div>
  );
}