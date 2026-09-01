import AdminUserDetailClient from './AdminUserDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminUserDetailPage({ params }: PageProps) {
  return <AdminUserDetailClient params={params} />;
}
