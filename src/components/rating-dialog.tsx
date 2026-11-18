"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderTitle: string;
  onRatingSubmit: () => void;
}

export function RatingDialog({ 
  open, 
  onOpenChange, 
  orderId, 
  orderTitle,
  onRatingSubmit 
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/v2/orders/${orderId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error codes
        if (data.code === 'ALREADY_RATED') {
          toast.error('You have already rated this order. Please refresh the page.');
        } else {
          throw new Error(data.error || 'Failed to submit rating');
        }
        return;
      }
      
      toast.success('Rating submitted successfully! Thank you for your feedback.');
      onRatingSubmit();
      onOpenChange(false);
      
      // Reset form
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate This Work</DialogTitle>
          <DialogDescription>
            Share your feedback on the quality and experience of this order
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">{orderTitle}</h4>
            <p className="text-sm text-muted-foreground">
              How would you rate the overall quality of this work?
            </p>
          </div>
          
          {/* Star Rating */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium">
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>
          
          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Additional Comments (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about the quality, timeliness, and overall experience..."
              rows={4}
              disabled={submitting}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRating}
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
