import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { store } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  X, 
  Scan, 
  Sparkles, 
  CheckCircle, 
  RefreshCw,
  Leaf,
  DollarSign
} from 'lucide-react';

interface EcoLensCameraProps {
  onClose: () => void;
}

export function EcoLensCamera({ onClose }: EcoLensCameraProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      // Fallback for demo - show mock camera
      setCameraActive(true);
      toast({
        title: "Camera simulation",
        description: "Using demo mode - in real app, this would access your camera",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const handleScan = async () => {
    setIsScanning(true);
    setSuggestions(null);
    
    try {
      const result = await store.getCameraSuggestions();
      setSuggestions(result);
      
      toast({
        title: "Scan complete! 📱",
        description: `Found suggestions with ${result.confidence}% confidence`,
      });
    } catch (error) {
      toast({
        title: "Scan failed",
        description: "Please try again or adjust lighting",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">Eco Lens</span>
          <Badge variant="secondary" className="bg-primary/20 text-primary">AR</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="text-center text-white/70">
              <Camera className="h-16 w-16 mx-auto mb-4 animate-pulse" />
              <p>Camera simulation mode</p>
              <p className="text-sm">Point at items to analyze</p>
            </div>
          </div>
        )}

        {/* Scan Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-64 h-64 border-2 border-primary rounded-lg relative ${
            isScanning ? 'animate-pulse' : ''
          }`}>
            {/* Corner markers */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-l-2 border-t-2 border-white rounded-tl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-r-2 border-t-2 border-white rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-2 border-b-2 border-white rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-2 border-b-2 border-white rounded-br" />
            
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 border border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            
            {isScanning && (
              <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Scan className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Analyzing...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions Overlay */}
        {suggestions && (
          <div className="absolute bottom-20 left-4 right-4">
            <Card className="bg-black/80 backdrop-blur-sm border-primary/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  EcoFinds Analysis
                  <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400">
                    {suggestions.confidence}% match
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {suggestions.suggestions.map((suggestion: string, index: number) => (
                    <div key={index} className="text-white text-sm flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-1">
                        {suggestion.includes('CO₂') ? (
                          <Leaf className="h-3 w-3 text-green-400" />
                        ) : (
                          <DollarSign className="h-3 w-3 text-yellow-400" />
                        )}
                      </div>
                      <p>{suggestion}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => setSuggestions(null)}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Scan Again
                  </Button>
                  <Button size="sm" onClick={() => {
                    toast({
                      title: "Great choice! 📱",
                      description: "Consider listing this item on EcoFinds",
                    });
                    handleClose();
                  }}>
                    List This Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-4 bg-black">
        <div className="flex items-center justify-center space-x-8">
          <Button
            variant="outline" 
            className="bg-white/10 border-white/20 text-white"
            onClick={() => setSuggestions(null)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button
            size="lg"
            className={`w-16 h-16 rounded-full ${
              isScanning 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-primary hover:bg-primary/90'
            }`}
            onClick={handleScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Scan className="h-6 w-6" />
            )}
          </Button>
          
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white"
            onClick={handleClose}
          >
            Done
          </Button>
        </div>
        
        <p className="text-center text-white/70 text-xs mt-4">
          Point camera at items to get instant resellability insights
        </p>
      </div>
    </div>
  );
}