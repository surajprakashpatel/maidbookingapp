import BookingDetailClient from './BookingDetailClient';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <BookingDetailClient params={params} />;
}
