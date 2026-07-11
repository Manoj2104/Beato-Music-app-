import JamRoomPage from '@/components/music/JamRoomClient';

export async function generateStaticParams() {
  return [
    { roomId: 'lobby' },
    { roomId: 'default' },
    { roomId: 'room-1' },
    { roomId: 'room-2' }
  ];
}

export default async function Page({ params }: { params: Promise<{ roomId: string }> }) {
  return <JamRoomPage params={params} />;
}
