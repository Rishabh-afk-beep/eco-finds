import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { store, CATEGORIES, ECO_CONSTANTS } from '@/lib/store';
import { AIProductAnalyzer } from '@/components/AIProductAnalyzer';
import { Plus, Image as ImageIcon, Leaf, Droplets } from 'lucide-react';

export default function AddProduct() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [customCO2, setCustomCO2] = useState('');
  const [customWater, setCustomWater] = useState('');

  const user = store.getCurrentUser();
  if (!user) {
    navigate('/login');
    return null;
  }

  const getEcoImpact = () => {
    if (customCO2 && customWater) {
      return {
        co2Kg: parseFloat(customCO2),
        waterL: parseFloat(customWater)
      };
    }
    
    if (category && ECO_CONSTANTS[category as keyof typeof ECO_CONSTANTS]) {
      return ECO_CONSTANTS[category as keyof typeof ECO_CONSTANTS];
    }
    
    return { co2Kg: 0, waterL: 0 };
  };

  const getSuggestedCategory = (productTitle: string) => {
    const title = productTitle.toLowerCase();
    
    if (title.includes('phone') || title.includes('laptop') || title.includes('computer') || 
        title.includes('tablet') || title.includes('tv') || title.includes('camera')) {
      return 'Electronics';
    }
    if (title.includes('shirt') || title.includes('jacket') || title.includes('dress') || 
        title.includes('jeans') || title.includes('shoes')) {
      return 'Clothing';
    }
    if (title.includes('book') || title.includes('novel') || title.includes('textbook')) {
      return 'Books';
    }
    if (title.includes('chair') || title.includes('table') || title.includes('desk') || 
        title.includes('sofa') || title.includes('bed')) {
      return 'Furniture';
    }
    if (title.includes('toy') || title.includes('baby') || title.includes('child') || 
        title.includes('kids')) {
      return 'Kids';
    }
    
    return '';
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    
    // Auto-suggest category
    if (newTitle.length > 3 && !category) {
      const suggested = getSuggestedCategory(newTitle);
      if (suggested) {
        setCategory(suggested);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!title.trim() || !description.trim() || !category || !price) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        toast({
          title: "Invalid price",
          description: "Please enter a valid price",
          variant: "destructive"
        });
        return;
      }

      const ecoImpact = getEcoImpact();
      
      const product = store.addProduct({
        title: title.trim(),
        description: description.trim(),
        category,
        price: priceNum,
        imageUrl: imageUrl.trim() || '/placeholder.svg',
        ecoImpact,
        ownerId: user.id
      });

      toast({
        title: "Product listed successfully! 🎉",
        description: `${product.title} has been added to the marketplace`
      });

      navigate('/my-listings');
    } catch (error) {
      toast({
        title: "Failed to list product",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ecoImpact = getEcoImpact();

  return (
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sell Your Item</h1>
        <p className="text-muted-foreground">
          Give your items a second life and help the environment
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Product Analyzer */}
          <AIProductAnalyzer 
            onAnalysisComplete={(analysis) => {
              setTitle(analysis.title);
              setCategory(analysis.category);
              // Auto-suggest a description based on title
              setDescription(`${analysis.title} in great condition. Perfect for giving this item a second life!`);
            }}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g., iPhone 12 Pro - Excellent Condition"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {imageUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={imageUrl} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the condition, features, and any other relevant details..."
                    rows={4}
                    required
                  />
                </div>

                {/* Custom Eco Values */}
                <div className="space-y-4">
                  <Label>Environmental Impact (Optional Override)</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customCO2">CO₂ Saved (kg)</Label>
                      <Input
                        id="customCO2"
                        type="number"
                        value={customCO2}
                        onChange={(e) => setCustomCO2(e.target.value)}
                        placeholder={category ? ECO_CONSTANTS[category as keyof typeof ECO_CONSTANTS]?.co2Kg.toString() : '0'}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customWater">Water Saved (L)</Label>
                      <Input
                        id="customWater"
                        type="number"
                        value={customWater}
                        onChange={(e) => setCustomWater(e.target.value)}
                        placeholder={category ? ECO_CONSTANTS[category as keyof typeof ECO_CONSTANTS]?.waterL.toString() : '0'}
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    "Listing product..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      List Product
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Impact */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl || '/placeholder.svg'} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                
                {title && (
                  <div>
                    <h3 className="font-semibold truncate">{title}</h3>
                    {category && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {category}
                      </Badge>
                    )}
                  </div>
                )}
                
                {price && (
                  <p className="text-lg font-bold text-primary">
                    ₹{parseFloat(price).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Environmental Impact */}
          {ecoImpact.co2Kg > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Leaf className="h-5 w-5 text-success mr-2" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-success/5 rounded-lg">
                    <Leaf className="h-5 w-5 text-success mx-auto mb-1" />
                    <p className="text-lg font-bold text-success">
                      {ecoImpact.co2Kg}kg
                    </p>
                    <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Droplets className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-600">
                      {ecoImpact.waterL}L
                    </p>
                    <p className="text-xs text-muted-foreground">Water Saved</p>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  By selling this item, you're helping someone avoid buying new and reducing environmental impact!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selling Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <ImageIcon className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <p>Add clear, well-lit photos to attract more buyers</p>
              </div>
              <div className="flex items-start space-x-2">
                <Leaf className="h-4 w-4 mt-0.5 text-success flex-shrink-0" />
                <p>Highlight the environmental benefits of buying pre-owned</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary mt-0.5">💰</span>
                <p>Price competitively by checking similar listings</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}