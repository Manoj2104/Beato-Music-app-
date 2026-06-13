import AlbumClient from './AlbumClient';

export async function generateStaticParams() {
  return [{ id: 'album-1' }, { id: 'album-2' }, { id: 'album-3' }, { id: 'album-4' }, { id: 'album-5' }, { id: 'album-6' }, { id: 'album-7' }, { id: 'album-8' }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AlbumClient params={params} />;
}
