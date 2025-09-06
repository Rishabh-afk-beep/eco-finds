import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { store } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Sparkles, Wand2, CheckCircle } from 'lucide-react';

interface AIProductAnalyzerProps {
  onAnalysisComplete: (analysis: { title: string; category: string; badges: string[]; }) => void;
}

export function AIProductAnalyzer({ onAnalysisComplete }: AIProductAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisResult(null);

    // Simulate AI analysis with progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    try {
      const analysis = await store.analyzeProduct(file);
      setProgress(100);
      setAnalysisResult(analysis);
      
      toast({
        title: "AI Analysis Complete! ✨",
        description: "Your product has been analyzed successfully",
      });
      
      onAnalysisComplete(analysis);
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      clearInterval(progressInterval);
    }
  };

  const useAnalysis = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult);
      toast({
        title: "Analysis applied!",
        description: "The AI suggestions have been applied to your product",
      });
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Sparkles className="h-5 w-5 text-primary mr-2" />
          AI Product Analyzer
          <Badge variant="secondary" className="ml-2">Beta</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a photo and let AI suggest the perfect title, category, and eco badges!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAnalyzing && !analysisResult && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="ai-image-upload"
                />
                <Button variant="outline" className="w-full" asChild>
                  <label htmlFor="ai-image-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </label>
                </Button>
              </div>
              <Button variant="outline" disabled>
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                <Wand2 className="h-3 w-3" />
                <span>AI-powered • Instant analysis • Smart suggestions</span>
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-medium">Analyzing your product...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>🔍 Identifying product category...</p>
              <p>🌱 Calculating environmental impact...</p>
              <p>✨ Generating smart title suggestions...</p>
            </div>
          </div>
        )}

        {analysisResult && !isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Analysis Complete!</span>
            </div>
            
            <div className="space-y-3 p-4 bg-background/50 rounded-lg border">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Suggested Title</label>
                <p className="text-sm font-semibold">{analysisResult.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-sm">{analysisResult.category}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Eco Badges</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysisResult.badges.map((badge: string) => (
                    <Badge key={badge} variant="secondary" className="text-xs">
                      {badge === 'High Impact Save' && '♻️'}
                      {badge === 'Eco Choice' && '🌱'}
                      {badge === 'Budget Saver' && '💸'}
                      {' ' + badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setAnalysisResult(null)}
                size="sm"
              >
                Try Again
              </Button>
              <Button onClick={useAnalysis} size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Use These Suggestions
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}