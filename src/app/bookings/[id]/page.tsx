import BookingDetailClient from './BookingDetailClient';

export function generateStaticParams() {
  return [{ id: 'bk-1001' }];
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <BookingDetailClient params={params} />;
}
