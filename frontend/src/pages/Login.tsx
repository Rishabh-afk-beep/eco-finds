import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { store } from '@/lib/store';
import { Leaf, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = store.login(email, password);
      if (user) {
        toast({
          title: "Welcome back!",
          description: `Good to see you again, ${user.username}. Let's continue your eco journey!`
        });
        navigate('/feed');
      } else {
        toast({
          title: "Invalid credentials",
          description: "Please check your email and password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = () => {
    setEmail('demo@ecofinds.com');
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary">Welcome to EcoFinds</h1>
          <p className="text-muted-foreground">Login to your sustainable marketplace</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email below to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Forgot Password and Sign Up Links */}
            <div className="flex justify-between mt-4 text-sm">
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Forgot Password?
              </Link>
              <Link to="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Eco Stats */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Join thousands of eco-conscious buyers and sellers
          </p>
          <div className="flex justify-center space-x-6 text-xs">
            <div className="flex items-center space-x-1">
              <Leaf className="h-3 w-3 text-success" />
              <span>50k+ CO₂ saved</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="h-3 w-3 bg-blue-500 rounded-full" />
              <span>1M+ L water saved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
