import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EcoLensCamera } from '@/components/EcoLensCamera';
import { Camera, Sparkles } from 'lucide-react';

export function FloatingActionButton() {
  const [showCamera, setShowCamera] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-success hover:scale-110 transition-all duration-300 z-30"
        onClick={() => setShowCamera(true)}
      >
        <div className="relative">
          <Camera className="h-6 w-6" />
          <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
        </div>
      </Button>
      
      {showCamera && (
        <EcoLensCamera onClose={() => setShowCamera(false)} />
      )}
    </>
  );
}