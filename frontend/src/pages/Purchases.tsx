import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { store, Order, Product } from '@/lib/store';
import { ShoppingBag, Leaf, Droplets, Calendar, Package } from 'lucide-react';

export default function Purchases() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<{ [key: string]: Product }>({});

  const user = store.getCurrentUser();
  if (!user) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const userOrders = store.getUserOrders();
    setOrders(userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    
    // Load product details
    const productMap: { [key: string]: Product } = {};
    userOrders.forEach(order => {
      order.productIds.forEach(productId => {
        const product = store.getProduct(productId);
        if (product) productMap[productId] = product;
      });
    });
    setProducts(productMap);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalImpact = orders.reduce((acc, order) => ({
    co2Kg: acc.co2Kg + order.ecoTotals.co2Kg,
    waterL: acc.waterL + order.ecoTotals.waterL
  }), { co2Kg: 0, waterL: 0 });

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No purchases yet</h2>
          <p className="text-muted-foreground mb-6">
            Start shopping for sustainable products!
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Purchase History</h1>
        <p className="text-muted-foreground">Your sustainable shopping journey</p>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{Math.round(totalImpact.co2Kg)}kg</p>
                <p className="text-sm text-muted-foreground">CO₂ Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Droplets className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{Math.round(totalImpact.waterL)}L</p>
                <p className="text-sm text-muted-foreground">Water Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(order.createdAt)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Products */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {order.productIds.map((productId) => {
                  const product = products[productId];
                  if (!product) return null;
                  
                  return (
                    <div key={productId} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                        <img 
                          src={product.imageUrl || '/placeholder.svg'} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{product.title}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                        <p className="text-sm font-bold text-primary">{formatPrice(product.price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                <div className="flex items-center gap-6">
                  <div className="flex items-center text-sm">
                    <Leaf className="h-4 w-4 text-success mr-1" />
                    <span>{Math.round(order.ecoTotals.co2Kg)}kg CO₂ saved</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Droplets className="h-4 w-4 text-blue-600 mr-1" />
                    <span>{Math.round(order.ecoTotals.waterL)}L water saved</span>
                  </div>
                  {order.carbonNeutralDonation && (
                    <Badge variant="outline" className="text-xs">
                      🌍 Carbon Neutral
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatPrice(order.subtotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}