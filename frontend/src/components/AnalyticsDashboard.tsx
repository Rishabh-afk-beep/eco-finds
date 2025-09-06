import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Leaf, Eye, Heart, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { store } from '@/lib/store';

interface AnalyticsData {
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  ecoImpact: { co2Kg: number; waterL: number };
  conversionRate: number;
  topPerformingProduct: string;
  monthlyGrowth: number;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    // Simulate analytics data generation
    const generateAnalytics = (): AnalyticsData => {
      const currentUser = store.getCurrentUser();
      if (!currentUser) return {
        totalViews: 0,
        totalSales: 0,
        totalRevenue: 0,
        ecoImpact: { co2Kg: 0, waterL: 0 },
        conversionRate: 0,
        topPerformingProduct: '',
        monthlyGrowth: 0
      };

      const userProducts = store.getProducts().filter(p => p.ownerId === currentUser.id);
      const orders = store.getOrders().filter(order =>
        order.productIds.some(pid => userProducts.find(p => p.id === pid))
      );

      return {
        totalViews: Math.floor(Math.random() * 5000) + 1000,
        totalSales: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.subtotal, 0),
        ecoImpact: orders.reduce((total, order) => ({
          co2Kg: total.co2Kg + order.ecoTotals.co2Kg,
          waterL: total.waterL + order.ecoTotals.waterL
        }), { co2Kg: 0, waterL: 0 }),
        conversionRate: Math.round((orders.length / (Math.floor(Math.random() * 100) + 50)) * 100),
        topPerformingProduct: userProducts[0]?.title || 'N/A',
        monthlyGrowth: Math.floor(Math.random() * 30) + 5
      };
    };

    setAnalytics(generateAnalytics());
  }, [timeRange]);

  if (!analytics) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatEcoImpact = (co2: number, water: number) => {
    return {
      co2: co2 < 1 ? `${Math.round(co2 * 1000)}g` : `${Math.round(co2)}kg`,
      water: water < 1000 ? `${Math.round(water)}L` : `${Math.round(water / 1000)}kL`
    };
  };

  const ecoFormatted = formatEcoImpact(analytics.ecoImpact.co2Kg, analytics.ecoImpact.waterL);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <Badge
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.monthlyGrowth}% from last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(analytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(analytics.monthlyGrowth * 1.2)}% from last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eco Impact</CardTitle>
            <Leaf className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-success">
              {ecoFormatted.co2} CO₂
            </div>
            <p className="text-xs text-muted-foreground">
              {ecoFormatted.water} water saved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Conversion Rate</span>
                <span className="font-medium">{analytics.conversionRate}%</span>
              </div>
              <Progress value={analytics.conversionRate} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>View to Sale Rate</span>
                <span className="font-medium">
                  {Math.round((analytics.totalSales / analytics.totalViews) * 100)}%
                </span>
              </div>
              <Progress 
                value={(analytics.totalSales / analytics.totalViews) * 100} 
                className="h-2" 
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Eco Impact Score</span>
                <span className="font-medium text-success">High</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Performing Product
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">{analytics.topPerformingProduct}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Views:</span>
                  <p className="font-medium">{Math.floor(analytics.totalViews * 0.3).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sales:</span>
                  <p className="font-medium">{Math.floor(analytics.totalSales * 0.4)}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Consider promoting similar eco-friendly items</li>
                <li>• Add more detailed eco impact information</li>
                <li>• Use high-quality images for better engagement</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}