// Profile Page - With Analytics Dashboard
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { useToast } from '@/hooks/use-toast';
import { store, User } from '@/lib/store';
import { 
  Leaf, 
  Droplets, 
  Award, 
  TrendingUp, 
  Edit,
  Save,
  X,
  LogOut
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    setUsername(currentUser.username);
    setAvatarUrl(currentUser.avatarUrl || '');
  }, [navigate]);

  const handleSaveProfile = () => {
    if (!user) return;

    store.updateUser({
      username: username.trim(),
      avatarUrl: avatarUrl.trim()
    });

    const updatedUser = store.getCurrentUser();
    setUser(updatedUser);
    setIsEditing(false);
    
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated"
    });
  };

  const handleCancelEdit = () => {
    if (user) {
      setUsername(user.username);
      setAvatarUrl(user.avatarUrl || '');
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    store.logout();
    navigate('/login');
    toast({
      title: "Logged out successfully",
      description: "Come back soon to continue your eco journey!"
    });
  };

  const getGreenBadge = (points: number) => {
    if (points >= 100) return { name: 'Eco Champion', color: 'bg-yellow-500', icon: '🏆' };
    if (points >= 50) return { name: 'Green Hero', color: 'bg-green-500', icon: '🌟' };
    if (points >= 20) return { name: 'Eco Warrior', color: 'bg-blue-500', icon: '⚡' };
    return { name: 'Eco Starter', color: 'bg-gray-500', icon: '🌱' };
  };

  const getProgressToNext = (points: number) => {
    if (points >= 100) return { progress: 100, next: 'Max Level!', needed: 0 };
    if (points >= 50) return { progress: (points - 50) / 50 * 100, next: 'Eco Champion', needed: 100 - points };
    if (points >= 20) return { progress: (points - 20) / 30 * 100, next: 'Green Hero', needed: 50 - points };
    return { progress: points / 20 * 100, next: 'Eco Warrior', needed: 20 - points };
  };

  if (!user) return null;

  const badge = getGreenBadge(user.greenPoints);
  const progress = getProgressToNext(user.greenPoints);

  return (
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and track your eco impact</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={isEditing ? avatarUrl : user.avatarUrl} />
                  <AvatarFallback className="text-lg">
                    {(isEditing ? username : user.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
                        <Input
                          id="avatarUrl"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold">{user.username}</h2>
                      <p className="text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-2">
                        {badge.icon} {badge.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Member since {new Date(user.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </CardContent>
          </Card>

          {/* Eco Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Leaf className="h-5 w-5 text-success mr-2" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-success/5 rounded-lg">
                  <Leaf className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold text-success">
                    {Math.round(user.totalCO2Saved)}kg
                  </p>
                  <p className="text-sm text-muted-foreground">Total CO₂ Saved</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Droplets className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(user.totalWaterSaved)}L
                  </p>
                  <p className="text-sm text-muted-foreground">Total Water Saved</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-primary">
                    {user.greenPoints}
                  </p>
                  <p className="text-sm text-muted-foreground">Green Points</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Impact Equivalent
                </h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>🚗 Equivalent to driving {Math.round(user.totalCO2Saved * 4.3)} km less</p>
                  <p>🌳 Like planting {Math.round(user.totalCO2Saved / 22)} trees</p>
                  <p>💧 Enough water saved for {Math.round(user.totalWaterSaved / 200)} showers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Green Points Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Green Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${badge.color} text-white text-2xl mb-2`}>
                  {badge.icon}
                </div>
                <p className="font-semibold">{badge.name}</p>
                <p className="text-sm text-muted-foreground">{user.greenPoints} points</p>
              </div>

              {progress.needed > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to {progress.next}</span>
                    <span>{progress.needed} points needed</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/my-listings')}
              >
                Manage My Listings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/purchases')}
              >
                Order History
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/add')}
              >
                Sell an Item
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Analytics Dashboard</CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAnalytics(false)}
                >
                  Hide Analytics
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AnalyticsDashboard />
            </CardContent>
          </Card>
        )}

        {!showAnalytics && (
          <Card>
            <CardContent className="p-6 text-center">
              <Button onClick={() => setShowAnalytics(true)}>
                View Analytics Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}