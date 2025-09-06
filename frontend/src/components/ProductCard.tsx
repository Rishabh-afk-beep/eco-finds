import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { WishlistButton } from '@/components/WishlistButton';
import { store, Product, User } from '@/lib/store';
import { ShoppingCart, Leaf, Droplets } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  owner?: User;
  showOwner?: boolean;
}

export function ProductCard({ product, owner, showOwner = true }: ProductCardProps) {
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to cart",
        variant: "destructive"
      });
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
      description: `${product.title} has been added to your cart`,
      variant: "default"
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatEcoImpact = (co2: number, water: number) => {
    return {
      co2: co2 < 1 ? `${Math.round(co2 * 1000)}g` : `${Math.round(co2)}kg`,
      water: water < 1000 ? `${Math.round(water)}L` : `${Math.round(water / 1000)}kL`
    };
  };

  const ecoFormatted = formatEcoImpact(product.ecoImpact.co2Kg, product.ecoImpact.waterL);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          <img 
            src={product.imageUrl || '/placeholder.svg'} 
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        
        <CardContent className="p-4">
          {/* Eco Impact Badge */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1 text-xs text-success bg-success/10 rounded-full px-2 py-1">
              <Leaf className="h-3 w-3" />
              <span className="flex items-center space-x-1">
                <span>{ecoFormatted.co2} CO₂</span>
                <Droplets className="h-3 w-3" />
                <span>{ecoFormatted.water}</span>
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{product.category}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Price */}
          <p className="text-lg font-bold text-primary mb-3">
            {formatPrice(product.price)}
          </p>

          {/* Badges */}
          {product.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.badges.map((badge) => (
                <Badge 
                  key={badge} 
                  variant="secondary" 
                  className="text-xs"
                >
                  {badge === 'High Impact Save' && '♻️'}
                  {badge === 'Eco Choice' && '🌱'}
                  {badge === 'Budget Saver' && '💸'}
                  {' ' + badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Owner & Actions */}
          <div className="flex items-center justify-between">
            {showOwner && owner && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={owner.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {owner.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {owner.username}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <WishlistButton productId={product.id} />
              <Button 
                size="sm" 
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}