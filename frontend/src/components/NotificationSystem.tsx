import { useState, useEffect } from 'react';
import { Bell, X, Heart, ShoppingCart, Star, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface Notification {
  id: string;
  type: 'wishlist_price_drop' | 'new_message' | 'review_reminder' | 'eco_milestone';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
  const [isOpen, setIsOpen] = useState(false);

  // Simulate notifications for demo
  useEffect(() => {
    const demoNotifications: Notification[] = [
      {
        id: '1',
        type: 'wishlist_price_drop',
        title: 'Price Drop Alert!',
        message: 'iPhone 12 Pro in your wishlist dropped by ₹5,000',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false
      },
      {
        id: '2',
        type: 'eco_milestone',
        title: 'Eco Milestone Achieved!',
        message: 'You\'ve saved 100kg of CO₂ this month! 🌱',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false
      },
      {
        id: '3',
        type: 'review_reminder',
        title: 'Review Reminder',
        message: 'How was your experience with the Nike Air Jordan?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true
      }
    ];

    if (notifications.length === 0) {
      setNotifications(demoNotifications);
    }
  }, [notifications.length, setNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'wishlist_price_drop':
        return <TrendingDown className="h-4 w-4 text-success" />;
      case 'new_message':
        return <Bell className="h-4 w-4 text-primary" />;
      case 'review_reminder':
        return <Star className="h-4 w-4 text-warning" />;
      case 'eco_milestone':
        return <Heart className="h-4 w-4 text-success" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-b-0 hover:bg-accent/50 cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="h-4 w-4 p-0 hover:bg-destructive/20"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}