import JamRoomClient from './JamRoomClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { roomId } = await params;
  return <JamRoomClient roomId={roomId} />;
}
