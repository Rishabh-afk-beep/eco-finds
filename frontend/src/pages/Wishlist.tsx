import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { store, Product, User } from '@/lib/store';
import { Heart, ShoppingBag } from 'lucide-react';

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    const user = store.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const wishlistIds = store.getWishlist();
      const products = wishlistIds
        .map(id => store.getProduct(id))
        .filter(Boolean) as Product[];
      
      setWishlistProducts(products);
      setUsers(store.getUsers());
      setIsLoading(false);
    }, 300);
  };

  const getProductOwner = (ownerId: string) => {
    return users.find(user => user.id === ownerId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold mb-2">Loading your wishlist...</h2>
        </div>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">Items you've saved for later</p>
        </div>

        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">
            Start adding items you love to your wishlist!
          </p>
          <Button onClick={() => navigate('/feed')}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Heart className="h-8 w-8 text-red-500 mr-3" />
          My Wishlist
        </h1>
        <p className="text-muted-foreground">
          {wishlistProducts.length} item{wishlistProducts.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wishlistProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            owner={getProductOwner(product.ownerId)}
          />
        ))}
      </div>
    </div>
  );
}