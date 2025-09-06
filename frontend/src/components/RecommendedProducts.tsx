import { useEffect, useState } from 'react';
import { store } from '@/lib/store';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { EmptyState } from './EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecommendedProductsProps {
  currentProductId?: string;
  userId?: string;
  category?: string;
  title?: string;
}

export function RecommendedProducts({ 
  currentProductId, 
  userId, 
  category, 
  title = "Recommended for you" 
}: RecommendedProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateRecommendations = () => {
      const allProducts = store.getProducts();
      let recommendations = [];

      if (category) {
        // Category-based recommendations
        recommendations = allProducts.filter(p => 
          p.category === category && 
          p.id !== currentProductId
        );
      } else if (userId) {
        // User behavior-based recommendations
        const userProducts = allProducts.filter(p => p.ownerId === userId);
        const userCategories = [...new Set(userProducts.map(p => p.category))];
        
        recommendations = allProducts.filter(p => 
          userCategories.includes(p.category) && 
          p.ownerId !== userId
        );
      } else {
        // Popular/trending recommendations
        recommendations = allProducts
          .sort((a, b) => b.ecoImpact.co2Kg - a.ecoImpact.co2Kg) // High impact items
          .slice(0, 8);
      }

      // Simulate loading delay for better UX
      setTimeout(() => {
        setProducts(recommendations.slice(0, 4));
        setLoading(false);
      }, 500);
    };

    generateRecommendations();
  }, [currentProductId, userId, category]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            type="search"
            title="No recommendations available"
            description="We couldn't find any recommended products at the moment."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            const owner = store.getUser(product.ownerId);
            return (
              <ProductCard
                key={product.id}
                product={product}
                owner={owner}
                showOwner={true}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}