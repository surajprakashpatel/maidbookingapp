import MaidProfileClient from './MaidProfileClient';

export function generateStaticParams() {
  return [{ id: 'test-maid-1' }];
}

export default function MaidProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <MaidProfileClient params={params} />;
}
