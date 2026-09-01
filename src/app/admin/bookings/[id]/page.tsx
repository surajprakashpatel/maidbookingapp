import AdminBookingDetailClient from './AdminBookingDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminBookingDetailPage({ params }: PageProps) {
  return <AdminBookingDetailClient params={params} />;
}
