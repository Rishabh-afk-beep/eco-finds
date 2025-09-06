// Product Detail Page - Professional Features
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductCard } from '@/components/ProductCard';
import { WishlistButton } from '@/components/WishlistButton';
import { RatingSystem } from '@/components/RatingSystem';
import { RecommendedProducts } from '@/components/RecommendedProducts';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { store, Product, User } from '@/lib/store';
import { 
  ShoppingCart, 
  Share, 
  Leaf, 
  Droplets, 
  ArrowLeft,
  MapPin,
  Calendar,
  Shield
} from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = (productId: string) => {
    setIsLoading(true);
    
    const foundProduct = store.getProduct(productId);
    if (foundProduct) {
      setProduct(foundProduct);
      
      const productOwner = store.getUser(foundProduct.ownerId);
      setOwner(productOwner);
      
      // Load related products (same category, different product)
      const allProducts = store.getProducts();
      const related = allProducts
        .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
        .slice(0, 4);
      setRelatedProducts(related);
    }
    
    setIsLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to cart",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (product.ownerId === currentUser.id) {
      toast({
        title: "Cannot add own item",
        description: "You cannot add your own items to cart",
        variant: "destructive"
      });
      return;
    }

    store.addToCart(product.id);
    toast({
      title: "Added to cart",
      description: `${product.title} has been added to your cart`
    });
  };

  const handleShare = async () => {
    if (!product) return;
    
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Could not copy link to clipboard",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
          </div>

          {/* Rating System */}
          <RatingSystem 
            productId={product.id} 
            sellerId={product.ownerId} 
          />

          {/* Related Products */}
          <RecommendedProducts 
            currentProductId={product.id}
            category={product.category}
            title="Similar Products"
          />
        </div>
      </div>
    </div>
  );
}

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/feed')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img 
              src={product.imageUrl || '/placeholder.svg'} 
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title & Category */}
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.category}
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <p className="text-3xl font-bold text-primary">
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Badges */}
          {product.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.badges.map((badge) => (
                <Badge key={badge} variant="outline" className="text-sm">
                  {badge === 'High Impact Save' && '♻️'}
                  {badge === 'Eco Choice' && '🌱'}
                  {badge === 'Budget Saver' && '💸'}
                  {' ' + badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Eco Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Leaf className="h-5 w-5 text-success mr-2" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-success/5 rounded-lg">
                  <Leaf className="h-6 w-6 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold text-success">
                    {product.ecoImpact.co2Kg}kg
                  </p>
                  <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Droplets className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {product.ecoImpact.waterL}L
                  </p>
                  <p className="text-sm text-muted-foreground">Water Saved</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                By buying this pre-owned item, you're helping reduce waste and environmental impact!
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              size="lg" 
              className="flex-1"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleShare}
            >
              <Share className="h-5 w-5" />
            </Button>
          </div>

          {/* Seller Info */}
          {owner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={owner.avatarUrl} />
                    <AvatarFallback>
                      {owner.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{owner.username}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Shield className="h-4 w-4 mr-1" />
                      <span>Verified Seller</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-success font-medium">
                      {owner.greenPoints} Green Points
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(owner.totalCO2Saved)}kg CO₂ saved
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Description */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {product.description}
          </p>
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            Listed on {formatDate(product.createdAt)}
          </div>
        </CardContent>
      </Card>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">More from {product.category}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                owner={store.getUser(relatedProduct.ownerId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}