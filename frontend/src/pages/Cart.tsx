import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { store, Product, Cart as CartType } from '@/lib/store';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Leaf, 
  Droplets,
  Sparkles
} from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartType>({ userId: '', items: [] });
  const [products, setProducts] = useState<Product[]>([]);
  const [carbonNeutral, setCarbonNeutral] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const currentCart = store.getCart();
    setCart(currentCart);
    
    // Load product details for cart items
    const productDetails = currentCart.items.map(item => 
      store.getProduct(item.productId)
    ).filter(Boolean) as Product[];
    
    setProducts(productDetails);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    store.updateCartItem(productId, newQuantity);
    loadCart();
    
    if (newQuantity === 0) {
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart"
      });
    }
  };

  const removeItem = (productId: string) => {
    store.updateCartItem(productId, 0);
    loadCart();
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart"
    });
  };

  const calculateTotals = () => {
    const subtotal = cart.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const ecoTotals = cart.items.reduce((totals, item) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        return {
          co2Kg: totals.co2Kg + (product.ecoImpact.co2Kg * item.quantity),
          waterL: totals.waterL + (product.ecoImpact.waterL * item.quantity)
        };
      }
      return totals;
    }, { co2Kg: 0, waterL: 0 });

    const carbonNeutralFee = carbonNeutral ? 10 : 0;
    const total = subtotal + carbonNeutralFee;

    return { subtotal, total, ecoTotals, carbonNeutralFee };
  };

  const handleCheckout = async () => {
    const user = store.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    if (cart.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checking out",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const order = store.createOrder(carbonNeutral);
      
      toast({
        title: "Order placed successfully! 🎉",
        description: `Your order has been placed. You've saved ${Math.round(order.ecoTotals.co2Kg)}kg CO₂!`
      });
      
      navigate('/purchases');
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const { subtotal, total, ecoTotals, carbonNeutralFee } = calculateTotals();

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Start adding some eco-friendly products to your cart!
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
          </p>
          {cart.items.length > 0 && (
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <div className="text-sm text-success font-medium">
                🌍 Total Impact: {Math.round(ecoTotals.co2Kg)}kg CO₂ & {Math.round(ecoTotals.waterL)}L water saved!
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;

            return (
              <Card key={item.productId}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={product.imageUrl || '/placeholder.svg'} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{product.title}</h3>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                      
                      {/* Eco Impact */}
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center text-xs text-success">
                          <Leaf className="h-3 w-3 mr-1" />
                          {Math.round(product.ecoImpact.co2Kg * item.quantity)}kg CO₂
                        </div>
                        <div className="flex items-center text-xs text-blue-600">
                          <Droplets className="h-3 w-3 mr-1" />
                          {Math.round(product.ecoImpact.waterL * item.quantity)}L
                        </div>
                      </div>

                      {/* Price & Quantity */}
                      <div className="flex items-center justify-between mt-3">
                        <p className="font-bold text-primary">
                          {formatPrice(product.price)}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Eco Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Leaf className="h-5 w-5 text-success mr-2" />
                Your Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-success/5 rounded-lg">
                  <Leaf className="h-5 w-5 text-success mx-auto mb-1" />
                  <p className="text-lg font-bold text-success">
                    {Math.round(ecoTotals.co2Kg)}kg
                  </p>
                  <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Droplets className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-600">
                    {Math.round(ecoTotals.waterL)}L
                  </p>
                  <p className="text-xs text-muted-foreground">Water Saved</p>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                By purchasing these pre-owned items, you're making a positive environmental impact!
              </p>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Carbon Neutral Option */}
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="carbon-neutral" 
                      checked={carbonNeutral}
                      onCheckedChange={setCarbonNeutral}
                    />
                    <Label htmlFor="carbon-neutral" className="text-sm font-medium">
                      Make this purchase carbon-neutral
                    </Label>
                  </div>
                  <span className="text-sm">{formatPrice(10)}</span>
                </div>
                {carbonNeutral && (
                  <div className="flex items-start space-x-2 p-3 bg-success/5 rounded-lg">
                    <Sparkles className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-success">
                      Great choice! We'll offset the remaining carbon footprint of your purchase through verified carbon offset projects.
                    </p>
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <Button 
                size="lg" 
                className="w-full"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Checkout ({formatPrice(total)})
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure checkout powered by eco-conscious technology
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}