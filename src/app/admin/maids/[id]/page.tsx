import AdminMaidDetailClient from './AdminMaidDetailClient';

export default function AdminMaidDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <AdminMaidDetailClient params={params} />;
}
