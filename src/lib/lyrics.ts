export interface LyricLine {
  time: number; // in seconds
  text: string;
}

// Timed lyrics for mock tracks
const MOCK_LYRICS: Record<string, LyricLine[]> = {
  'track-1': [
    { time: 0, text: "🎵 (Ethereal Synth Intro) 🎵" },
    { time: 4, text: "Watching the neon cascade..." },
    { time: 8, text: "Into the midnight shade." },
    { time: 12, text: "Floating away, no delay..." },
    { time: 16, text: "In this digital arcade." },
    { time: 20, text: "Can you hear the stellar drift?" },
    { time: 24, text: "A cosmic wave, a gravity lift." },
    { time: 28, text: "We are riding the soundwaves tonight." },
    { time: 32, text: "Underneath the auroral light." },
    { time: 36, text: "🎵 (Melodic Break) 🎵" },
    { time: 44, text: "Let the frequencies align..." },
    { time: 48, text: "Across the space and time." },
    { time: 52, text: "We are more than just a code..." },
    { time: 56, text: "On this everlasting road." },
    { time: 60, text: "So turn it up, let it flow." },
    { time: 64, text: "To the deep valleys below." },
    { time: 68, text: "We are riding the soundwaves tonight." },
    { time: 72, text: "Underneath the auroral light." }
  ],
  'track-2': [
    { time: 0, text: "🎵 (Ambient Space Echo) 🎵" },
    { time: 6, text: "Lost in the stellar drift..." },
    { time: 11, text: "Seeking the ancient myth." },
    { time: 16, text: "Between the stars we sail..." },
    { time: 21, text: "Leaving a stardust trail." },
    { time: 26, text: "Infinite black, endless white..." },
    { time: 31, text: "Guiding us through the night." },
    { time: 36, text: "Hold on to the frequency..." },
    { time: 41, text: "Set our spirits free." }
  ],
  'track-3': [
    { time: 0, text: "🎵 (Piano and Gentle Waves) 🎵" },
    { time: 5, text: "Walking on a glass ocean..." },
    { time: 10, text: "Every wave in slow motion." },
    { time: 15, text: "Reflections of our dreams..." },
    { time: 20, text: "Shining in silver beams." },
    { time: 25, text: "Don't look down, keep your stride..." },
    { time: 30, text: "Let the tides decide." },
    { time: 35, text: "Walking on a glass ocean..." },
    { time: 40, text: "Every wave in slow motion." }
  ],
  'track-4': [
    { time: 0, text: "🎵 (Heavy Hip-Hop Beat) 🎵" },
    { time: 2, text: "Yeah, binary pulse in the brain..." },
    { time: 5, text: "Washing away all the pain." },
    { time: 8, text: "Zeros and ones in the system..." },
    { time: 11, text: "Beats hitting, you can't resist them." },
    { time: 14, text: "We coding the future, no cap..." },
    { time: 17, text: "Mapping the world on the map." },
    { time: 20, text: "Cipher Nova, we bring the speed..." },
    { time: 23, text: "Everything that you need." }
  ]
};

// Generic lyrics generator for track names
export function getLyricsForTrack(trackId: string, trackTitle: string, artistName: string): LyricLine[] {
  if (MOCK_LYRICS[trackId]) {
    return MOCK_LYRICS[trackId];
  }

  // Generate generic lyrics based on track details
  return [
    { time: 0, text: `🎵 Listening to ${trackTitle} by ${artistName} 🎵` },
    { time: 5, text: "Welcome to Beato..." },
    { time: 10, text: "Where the music comes alive." },
    { time: 15, text: "Feel the bass in your chest..." },
    { time: 20, text: "Let the rhythm take control." },
    { time: 25, text: "Every beat, every note, every chord..." },
    { time: 30, text: "Telling a story of its own." },
    { time: 35, text: "🎵 (Instrumental Chorus) 🎵" },
    { time: 45, text: "We are moving with the flow..." },
    { time: 50, text: "Nowhere else we'd rather go." },
    { time: 55, text: "Thank you for streaming with us..." },
    { time: 60, text: "Enjoy the premium sound." }
  ];
}
