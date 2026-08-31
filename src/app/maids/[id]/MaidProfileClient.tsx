'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { subscribeToMaidById } from '@/lib/services/maidService';
import { subscribeToMaidReviews, createReview } from '@/lib/services/reviewService';
import { Maid, Review } from '@/lib/types';
import { formatINR, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/app-context';
import {
  MapPin, CheckCircle, Shield,
  Languages, Briefcase, UserX, Calendar, Star, MessageSquare, Plus, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function MaidProfileClient({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  const routeParams = useParams();
  const id = (routeParams?.id as string) || resolved?.id;
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useApp();

  const [maid, setMaid] = useState<Maid | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Dialog state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsubMaid = subscribeToMaidById(id, (liveMaid) => {
      setMaid(liveMaid);
      setLoading(false);
    });

    const unsubReviews = subscribeToMaidReviews(id, (liveReviews) => {
      setReviews(liveReviews);
    });

    return () => {
      unsubMaid();
      unsubReviews();
    };
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('error', 'Login Required', 'Please log in to submit a review.');
      router.push('/login');
      return;
    }
    if (!comment.trim()) {
      showToast('error', 'Comment Required', 'Please enter your review feedback.');
      return;
    }

    setSubmittingReview(true);
    const res = await createReview({
      maidId: id,
      customerId: user.id,
      customerName: user.name || 'Verified Customer',
      rating,
      comment: comment.trim(),
    });

    setSubmittingReview(false);
    if (res.success) {
      showToast('success', 'Review Submitted!', 'Thank you for your rating.');
      setShowReviewModal(false);
      setComment('');
      setRating(5);
    } else {
      showToast('error', 'Submission Failed', res.error || 'Could not submit review.');
    }
  };

  if (loading) {
    return (
      <AppShell role="customer" headerProps={{ title: 'Maid Profile', showBack: true }}>
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!maid) {
    return (
      <AppShell role="customer" headerProps={{ title: 'Maid Profile', showBack: true }}>
        <div className="empty-state">
          <div className="empty-state-icon"><UserX size={36} style={{ color: 'var(--gray-400)' }} /></div>
          <div className="empty-state-title">Maid not found</div>
          <Button onClick={() => router.push('/home')} className="mt-3">Back to Home</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="customer" headerProps={{ title: maid.name, showBack: true }}>
      <div className="animate-fade-in space-y-5">
        {/* Profile Card Banner */}
        <Card className="border-none bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white p-6 rounded-3xl shadow-md">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full border-3 border-white/40 bg-white/20 flex items-center justify-center font-bold text-2xl overflow-hidden shrink-0">
              {maid.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={maid.profilePhoto} alt={maid.name} className="size-full object-cover" />
              ) : (
                maid.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white truncate">{maid.name}</h1>
                <Badge variant="success" className="bg-white/20 text-white border-white/30">
                  <Shield className="size-3 text-white" /> Verified
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
                <MapPin className="size-3.5" /> {maid.area}, {maid.city}
              </div>
              <div className="flex items-center gap-3 text-xs text-white/90 font-medium mt-2">
                <span className="flex items-center gap-1"><Briefcase className="size-3.5" /> {maid.experience} yrs exp</span>
                <span className="flex items-center gap-1"><Star className="size-3.5 fill-amber-300 text-amber-300" /> {maid.rating || 4.8} ({reviews.length})</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing Rates Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="text-center p-3">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Hourly</div>
            <div className="text-base font-extrabold text-[var(--primary-700)] mt-1">
              {maid.hourlyPrice ? formatINR(maid.hourlyPrice) : 'N/A'}
            </div>
          </Card>
          <Card className="text-center p-3">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Daily</div>
            <div className="text-base font-extrabold text-[var(--primary-700)] mt-1">
              {maid.dailyPrice ? formatINR(maid.dailyPrice) : 'N/A'}
            </div>
          </Card>
          <Card className="text-center p-3">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Monthly</div>
            <div className="text-base font-extrabold text-[var(--primary-700)] mt-1">
              {maid.monthlyPrice ? formatINR(maid.monthlyPrice) : 'N/A'}
            </div>
          </Card>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
            <TabsTrigger value="about" className="flex-1">About & Skills</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="verification" className="flex-1">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Services Provided</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {maid.services.map(s => (
                    <Badge key={s} variant="secondary" className="px-3 py-1 text-xs">
                      <CheckCircle className="size-3 text-[var(--success-600)]" /> {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="mt-4 space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Bio & Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {maid.bio || 'Experienced verified maid with background check complete in Bhilai.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Languages className="size-4 text-[var(--primary-600)] shrink-0" />
                  <span>Languages: {maid.languages?.join(', ') || 'Hindi'}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Customer Ratings</h3>
              <Button size="sm" variant="outline" onClick={() => setShowReviewModal(true)} className="gap-1.5 text-xs font-bold">
                <Plus className="size-3.5" /> Write Review
              </Button>
            </div>

            {reviews.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-500">
                No reviews yet. Be the first to leave feedback for {maid.name}!
              </Card>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <Card key={r.id} className="p-4 border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{r.customerName}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`size-3 ${star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{r.comment}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">{formatDate(r.createdAt)}</span>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verification" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Verification Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-[var(--success-50)] rounded-xl text-xs text-[var(--success-700)] font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[var(--success-600)]" />
                    <span>Aadhaar ID Verified ({maid.aadhaarMasked || 'XXXX-XXXX-1234'})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[var(--success-50)] rounded-xl text-xs text-[var(--success-700)] font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[var(--success-600)]" />
                    <span>Live Camera Selfie Verified</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[var(--success-50)] rounded-xl text-xs text-[var(--success-700)] font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[var(--success-600)]" />
                    <span>Admin Background Approval</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA Button */}
        <Button
          onClick={() => router.push(`/booking?maidId=${maid.id}`)}
          className="w-full h-12 text-base font-bold shadow-md cursor-pointer"
        >
          <Calendar className="size-5" /> Book {maid.name} Now
        </Button>

        <div className="h-6" />
      </div>

      {/* Review Submission Dialog */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review {maid.name}</DialogTitle>
            <DialogDescription>Share your honest experience to help other households.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`size-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Comments</label>
              <textarea
                rows={3}
                required
                placeholder="How was the service punctuality, cleaning quality, and behavior?"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none"
              />
            </div>

            <Button type="submit" disabled={submittingReview} className="w-full font-bold">
              {submittingReview ? <Loader2 className="size-4 animate-spin" /> : 'Submit Review'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
