import MaidBookingDetailClient from './MaidBookingDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [{ id: 'bk-1001' }];
}

export default function MaidBookingDetailPage({ params }: PageProps) {
  return <MaidBookingDetailClient params={params} />;
}
