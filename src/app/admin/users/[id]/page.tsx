import AdminUserDetailClient from './AdminUserDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [{ id: 'test-cust-1' }];
}

export default function AdminUserDetailPage({ params }: PageProps) {
  return <AdminUserDetailClient params={params} />;
}
