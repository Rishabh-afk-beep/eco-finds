import { useState } from 'react';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { store } from '@/lib/store';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  timestamp: Date;
  helpful: number;
  verified: boolean;
}

interface RatingSystemProps {
  productId: string;
  sellerId: string;
}

export function RatingSystem({ productId, sellerId }: RatingSystemProps) {
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  // Mock reviews data - in real app this would come from backend
  const reviews: Review[] = [
    {
      id: '1',
      userId: 'user2',
      userName: 'Sarah Chen',
      userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      rating: 5,
      comment: 'Amazing product! Exactly as described and great eco impact. Fast delivery too.',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      helpful: 12,
      verified: true
    },
    {
      id: '2',
      userId: 'user3',
      userName: 'Mike Johnson',
      rating: 4,
      comment: 'Good quality, minor scratches but totally worth it for the price.',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      helpful: 5,
      verified: true
    }
  ];

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const handleSubmitReview = () => {
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      toast({
        title: "Please login",
        description: "You need to be logged in to leave a review",
        variant: "destructive"
      });
      return;
    }

    if (userRating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    // In real app, this would be sent to backend
    toast({
      title: "Review submitted",
      description: "Thank you for your feedback!",
    });

    setShowForm(false);
    setUserRating(0);
    setComment('');
  };

  const renderStars = (rating: number, interactive = false, size = "w-4 h-4") => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} cursor-${interactive ? 'pointer' : 'default'} ${
              star <= (interactive ? (hoveredRating || userRating) : rating)
                ? 'fill-warning text-warning'
                : 'text-muted-foreground'
            }`}
            onClick={interactive ? () => setUserRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Reviews & Ratings
          </CardTitle>
          <div className="flex items-center gap-2">
            {renderStars(averageRating)}
            <span className="text-sm text-muted-foreground">
              ({reviews.length} reviews)
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Review Section */}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
            Write a Review
          </Button>
        ) : (
          <div className="space-y-4 p-4 border rounded-lg">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              {renderStars(userRating, true, "w-6 h-6")}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Your Review</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSubmitReview}>Submit Review</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setUserRating(0);
                  setComment('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.userAvatar} />
                  <AvatarFallback className="text-xs">
                    {review.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{review.userName}</span>
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Verified Purchase
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                        Math.floor((review.timestamp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                        'day'
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                  </div>
                  
                  <p className="text-sm text-foreground">{review.comment}</p>
                  
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Helpful ({review.helpful})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}