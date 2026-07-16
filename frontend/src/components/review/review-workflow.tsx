'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react'

interface Review {
  id: string
  inspectionId: string
  reviewerId: string
  reviewer: { name: string }
  approved: boolean | null
  comments?: string
  reviewedAt: string
}

interface ReviewWorkflowProps {
  inspectionId: string
  reviews: Review[]
  canReview: boolean
  onSubmitReview: (approved: boolean, comments: string) => void
  onViewDetails: () => void
}

export function ReviewWorkflow({ inspectionId, reviews, canReview, onSubmitReview, onViewDetails }: ReviewWorkflowProps) {
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewData, setReviewData] = useState({
    approved: true,
    comments: '',
  })

  const handleSubmitReview = () => {
    onSubmitReview(reviewData.approved, reviewData.comments)
    setShowReviewDialog(false)
    setReviewData({ approved: true, comments: '' })
  }

  const latestReview = reviews[reviews.length - 1]
  const isPending = !latestReview || latestReview.approved === null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Review Workflow
            </CardTitle>
            <CardDescription>Inspection approval and review history</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            {canReview && isPending && (
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Review Inspection</DialogTitle>
                    <DialogDescription>Provide your approval decision and comments</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Decision</Label>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={reviewData.approved ? 'default' : 'outline'}
                          onClick={() => setReviewData({ ...reviewData, approved: true })}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant={!reviewData.approved ? 'destructive' : 'outline'}
                          onClick={() => setReviewData({ ...reviewData, approved: false })}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="review-comments">Comments</Label>
                      <Textarea
                        id="review-comments"
                        value={reviewData.comments}
                        onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                        placeholder="Add your review comments..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleSubmitReview} className="w-full">
                      Submit Review
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.reviewer.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.approved === true && (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                  {review.approved === false && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  )}
                  {review.approved === null && (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
                {review.comments && (
                  <p className="text-sm text-muted-foreground">{review.comments}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {isPending && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <MessageSquare className="inline h-4 w-4 mr-2" />
              This inspection is pending review
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
