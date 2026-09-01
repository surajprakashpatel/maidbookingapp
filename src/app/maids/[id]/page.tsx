import MaidProfileClient from './MaidProfileClient';

export default function MaidProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <MaidProfileClient params={params} />;
}
