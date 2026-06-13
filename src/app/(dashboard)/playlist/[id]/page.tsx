import PlaylistClient from './PlaylistClient';

export async function generateStaticParams() {
  return [{ id: 'playlist-1' }, { id: 'playlist-2' }, { id: 'playlist-3' }, { id: 'playlist-4' }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PlaylistClient params={params} />;
}
