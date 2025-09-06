import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { store } from '@/lib/store';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  Leaf,
  Plus,
  Package,
  Moon,
  Sun,
  LogOut,
  Heart
} from 'lucide-react';

export function Layout() {
  const [user, setUser] = useState(store.getCurrentUser());
  const [cartCount, setCartCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize data on first load
    store.seedData();
    
    // Update cart count
    updateCartCount();
    
    // Check theme
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    setUser(store.getCurrentUser());
    updateCartCount();
  }, [location]);

  const updateCartCount = () => {
    const cart = store.getCart();
    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  const handleLogout = () => {
    store.logout();
    setUser(null);
    navigate('/login');
    toast({
      title: "Logged out successfully",
      description: "Come back soon to continue your eco journey!"
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/feed?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { to: '/feed', label: 'Browse', icon: Search },
    { to: '/add', label: 'Sell', icon: Plus },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/my-listings', label: 'My Items', icon: Package },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/feed" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">EcoFinds</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search sustainable products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Button
                    key={item.to}
                    variant={location.pathname === item.to ? "default" : "ghost"}
                    size="sm"
                    asChild
                    className="relative"
                  >
                    <Link to={item.to} className="flex items-center space-x-1">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu */}
          {user && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </form>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-2">
                    {navItems.map((item) => (
                      <Button
                        key={item.to}
                        variant={location.pathname === item.to ? "default" : "ghost"}
                        className="justify-start"
                        asChild
                      >
                        <Link to={item.to} className="flex items-center space-x-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    ))}
                  </nav>

                  <div className="border-t pt-4 flex flex-col space-y-2">
                    <Button variant="ghost" className="justify-start" onClick={toggleTheme}>
                      {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
          <div className="flex items-center justify-around py-2">
            {navItems.slice(0, 5).map((item) => (
              <Button
                key={item.to}
                variant="ghost"
                size="sm"
                className="relative flex-col h-auto py-2"
                asChild
              >
                <Link to={item.to}>
                  <item.icon className={`h-5 w-5 ${location.pathname === item.to ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs mt-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}