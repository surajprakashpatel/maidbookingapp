import MaidBookingDetailClient from './MaidBookingDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MaidBookingDetailPage({ params }: PageProps) {
  return <MaidBookingDetailClient params={params} />;
}
