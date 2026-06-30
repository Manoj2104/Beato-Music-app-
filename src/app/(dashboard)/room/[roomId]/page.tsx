import JamRoomClient from './JamRoomClient';

export async function generateStaticParams() {
  return [
    { roomId: 'temp' }
  ];
}

export default function Page({ params }: { params: Promise<{ roomId: string }> }) {
  return <JamRoomClient params={params} />;
}
