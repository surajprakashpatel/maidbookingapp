import AdminBookingDetailClient from './AdminBookingDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [{ id: 'test-bk-1' }];
}

export default function AdminBookingDetailPage({ params }: PageProps) {
  return <AdminBookingDetailClient params={params} />;
}
