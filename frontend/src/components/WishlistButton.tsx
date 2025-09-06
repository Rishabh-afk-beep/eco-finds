import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { store } from '@/lib/store';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
  productId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function WishlistButton({ productId, variant = 'ghost', size = 'sm', className }: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsInWishlist(store.isInWishlist(productId));
  }, [productId]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to your wishlist",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (isInWishlist) {
        store.removeFromWishlist(productId);
        setIsInWishlist(false);
        toast({
          title: "Removed from wishlist",
          description: "Item has been removed from your wishlist"
        });
      } else {
        store.addToWishlist(productId);
        setIsInWishlist(true);
        toast({
          title: "Added to wishlist ❤️",
          description: "Item has been added to your wishlist"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`transition-all duration-200 ${className}`}
      onClick={handleToggleWishlist}
      disabled={isLoading}
    >
      <Heart 
        className={`h-4 w-4 transition-all duration-200 ${
          isInWishlist 
            ? 'fill-red-500 text-red-500 scale-110' 
            : 'text-muted-foreground hover:text-red-500'
        }`} 
      />
      {size === 'default' && (
        <span className="ml-2">
          {isInWishlist ? 'Saved' : 'Save'}
        </span>
      )}
    </Button>
  );
}