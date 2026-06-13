import ArtistClient from './ArtistClient';

export async function generateStaticParams() {
  return [{ id: 'artist-1' }, { id: 'artist-2' }, { id: 'artist-3' }, { id: 'artist-4' }, { id: 'artist-5' }, { id: 'artist-6' }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ArtistClient params={params} />;
}
