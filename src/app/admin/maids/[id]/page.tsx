import AdminMaidDetailClient from './AdminMaidDetailClient';

export function generateStaticParams() {
  return [{ id: 'test-maid-1' }];
}

export default function AdminMaidDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <AdminMaidDetailClient params={params} />;
}
