import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { store, Product } from '@/lib/store';
import { Plus, Edit, Trash2, Leaf, Droplets, Package } from 'lucide-react';

export default function MyListings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null
  });
  const [lastDeleted, setLastDeleted] = useState<{ product: Product; timeout: NodeJS.Timeout } | null>(null);

  const user = store.getCurrentUser();
  if (!user) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    loadMyProducts();
  }, []);

  const loadMyProducts = () => {
    const allProducts = store.getProducts();
    const myProducts = allProducts.filter(product => product.ownerId === user.id);
    setProducts(myProducts);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteDialog({ open: true, product });
  };

  const confirmDelete = () => {
    if (!deleteDialog.product) return;

    const product = deleteDialog.product;
    store.deleteProduct(product.id);
    loadMyProducts();
    setDeleteDialog({ open: false, product: null });

    // Set up undo functionality
    const timeout = setTimeout(() => {
      setLastDeleted(null);
    }, 5000);

    setLastDeleted({ product, timeout });

    toast({
      title: "Product deleted",
      description: (
        <div className="flex items-center justify-between">
          <span>{product.title} has been deleted</span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleUndo}
            className="ml-2"
          >
            Undo
          </Button>
        </div>
      )
    });
  };

  const handleUndo = () => {
    if (!lastDeleted) return;

    // Clear the timeout
    clearTimeout(lastDeleted.timeout);

    // Re-add the product
    store.addProduct({
      ...lastDeleted.product,
      ownerId: user.id
    });

    loadMyProducts();
    setLastDeleted(null);

    toast({
      title: "Product restored",
      description: `${lastDeleted.product.title} has been restored`
    });
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

  const totalImpact = products.reduce((acc, product) => ({
    co2Kg: acc.co2Kg + product.ecoImpact.co2Kg,
    waterL: acc.waterL + product.ecoImpact.waterL
  }), { co2Kg: 0, waterL: 0 });

  return (
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Listings</h1>
          <p className="text-muted-foreground">
            Manage your products and track their environmental impact
          </p>
        </div>
        <Button onClick={() => navigate('/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      {products.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
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
                  <p className="text-sm text-muted-foreground">Total CO₂ Impact</p>
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
                  <p className="text-sm text-muted-foreground">Total Water Impact</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product List */}
      {products.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square overflow-hidden bg-muted">
                <img 
                  src={product.imageUrl || '/placeholder.svg'} 
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteProduct(product)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                  {product.title}
                </h3>

                <p className="text-lg font-bold text-primary mb-3">
                  {formatPrice(product.price)}
                </p>

                {/* Eco Impact */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Leaf className="h-3 w-3 text-success mr-1" />
                    <span>{product.ecoImpact.co2Kg}kg CO₂</span>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="h-3 w-3 text-blue-600 mr-1" />
                    <span>{product.ecoImpact.waterL}L</span>
                  </div>
                </div>

                {/* Badges */}
                {product.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.badges.slice(0, 2).map((badge) => (
                      <Badge key={badge} variant="outline" className="text-xs">
                        {badge === 'High Impact Save' && '♻️'}
                        {badge === 'Eco Choice' && '🌱'}
                        {badge === 'Budget Saver' && '💸'}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Listed on {formatDate(product.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No listings yet</h2>
          <p className="text-muted-foreground mb-6">
            Start selling your items and help others shop sustainably!
          </p>
          <Button onClick={() => navigate('/add')}>
            <Plus className="h-4 w-4 mr-2" />
            List Your First Item
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.product?.title}"? This action can be undone within 5 seconds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, product: null })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}