import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

export function useCart() {
  const [cartItems, setCartItems] = useState(store.getCart().items);
  const { toast } = useToast();

  useEffect(() => {
    // Refresh cart items when component mounts
    setCartItems(store.getCart().items);
  }, []);

  const addToCart = (productId: string, showToast = true) => {
    const product = store.getProduct(productId);
    const currentUser = store.getCurrentUser();
    
    if (!currentUser) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to cart",
        variant: "destructive"
      });
      return false;
    }

    if (product?.ownerId === currentUser.id) {
      toast({
        title: "Cannot add own item",
        description: "You cannot add your own items to cart",
        variant: "destructive"
      });
      return false;
    }

    store.addToCart(productId);
    setCartItems(store.getCart().items);
    
    if (showToast) {
      toast({
        title: "Added to cart",
        description: `${product?.title} has been added to your cart`,
      });
    }
    
    return true;
  };

  const removeFromCart = (productId: string) => {
    store.updateCartItem(productId, 0);
    setCartItems(store.getCart().items);
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart",
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    store.updateCartItem(productId, quantity);
    setCartItems(store.getCart().items);
  };

  const clearCart = () => {
    store.clearCart();
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = store.getProduct(item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const getEcoTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = store.getProduct(item.productId);
      if (product) {
        return {
          co2Kg: total.co2Kg + (product.ecoImpact.co2Kg * item.quantity),
          waterL: total.waterL + (product.ecoImpact.waterL * item.quantity)
        };
      }
      return total;
    }, { co2Kg: 0, waterL: 0 });
  };

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getEcoTotal,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };
}