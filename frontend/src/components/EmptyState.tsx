import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ShoppingBag, Heart, Package } from "lucide-react";

interface EmptyStateProps {
  type: 'search' | 'cart' | 'wishlist' | 'listings' | 'purchases';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ type, title, description, actionLabel, onAction }: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="h-16 w-16 text-muted-foreground" />;
      case 'cart':
        return <ShoppingBag className="h-16 w-16 text-muted-foreground" />;
      case 'wishlist':
        return <Heart className="h-16 w-16 text-muted-foreground" />;
      case 'listings':
        return <Package className="h-16 w-16 text-muted-foreground" />;
      case 'purchases':
        return <ShoppingBag className="h-16 w-16 text-muted-foreground" />;
      default:
        return <Search className="h-16 w-16 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 opacity-50">
          {getIcon()}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}