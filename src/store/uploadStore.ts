import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UploadStage =
  | 'idle' | 'validating' | 'uploading' | 'processing'
  | 'transcoding_320' | 'transcoding_160' | 'transcoding_96'
  | 'waveform' | 'indexing' | 'publishing' | 'done' | 'error';

export interface UploadJob {
  id: string;
  title: string;
  artistName: string;
  albumName: string;
  genre: string;
  language: string;
  releaseDate: string;
  explicit: boolean;
  lyrics: string;
  audioFileName: string;
  audioUrl?: string;
  coverUrl: string;
  stage: UploadStage;
  overallProgress: number;
  stageProgress: number;
  error?: string;
  waveform: number[];
  bitrates: { '320kbps': boolean; '160kbps': boolean; '96kbps': boolean };
  copyrightAccepted: boolean;
  policyAccepted: boolean;
  publishedTrackId?: string;
  uploadedAt?: string;
}

const STAGE_ORDER: UploadStage[] = [
  'validating', 'uploading', 'processing',
  'transcoding_320', 'transcoding_160', 'transcoding_96',
  'waveform', 'indexing', 'publishing', 'done'
];

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: 'Ready',
  validating: 'Validating file...',
  uploading: 'Uploading to cloud storage...',
  processing: 'Processing audio...',
  transcoding_320: 'Transcoding 320kbps...',
  transcoding_160: 'Transcoding 160kbps...',
  transcoding_96: 'Transcoding 96kbps...',
  waveform: 'Generating waveform...',
  indexing: 'Indexing for search...',
  publishing: 'Publishing to platform...',
  done: 'Published!',
  error: 'Upload failed',
};

interface UploadStore {
  currentJob: UploadJob | null;
  uploadHistory: Omit<UploadJob, 'audioUrl'>[];
  isProcessing: boolean;

  startUpload: (job: Omit<UploadJob, 'stage' | 'overallProgress' | 'stageProgress' | 'waveform' | 'bitrates' | 'id'>) => Promise<string>;
  cancelUpload: () => void;
  reset: () => void;
  getStageLabel: (stage: UploadStage) => string;
  getStageProgress: (stage: UploadStage) => number;
}

export const useUploadStore = create<UploadStore>()(
  persist(
    (set, get) => ({
      currentJob: null,
      uploadHistory: [],
      isProcessing: false,

      getStageLabel: (stage) => STAGE_LABELS[stage] ?? stage,

      getStageProgress: (stage) => {
        const idx = STAGE_ORDER.indexOf(stage);
        if (idx < 0) return 0;
        return Math.round((idx / (STAGE_ORDER.length - 1)) * 100);
      },

      startUpload: async (jobData) => {
        const id = `track-upload-${Date.now()}`;
        const job: UploadJob = {
          ...jobData,
          id,
          stage: 'idle',
          overallProgress: 0,
          stageProgress: 0,
          waveform: [],
          bitrates: { '320kbps': false, '160kbps': false, '96kbps': false },
        };

        set({ currentJob: job, isProcessing: true });

        const stageDurations: Partial<Record<UploadStage, number>> = {
          validating: 800,
          uploading: 2000,
          processing: 1500,
          transcoding_320: 1200,
          transcoding_160: 900,
          transcoding_96: 700,
          waveform: 1000,
          indexing: 600,
          publishing: 800,
        };

        let cancelled = false;

        for (const stage of STAGE_ORDER) {
          if (stage === 'done') break;
          if (cancelled) return id;

          const duration = stageDurations[stage] ?? 500;
          const steps = 20;
          const stepTime = duration / steps;

          set(state => ({
            currentJob: state.currentJob ? { ...state.currentJob, stage } : null
          }));

          for (let i = 1; i <= steps; i++) {
            await new Promise(r => setTimeout(r, stepTime));
            if (get().currentJob === null) { cancelled = true; break; }

            const stageIdx = STAGE_ORDER.indexOf(stage);
            const overall = Math.round(((stageIdx + i / steps) / STAGE_ORDER.length) * 100);

            // Generate waveform data when at waveform stage
            const waveform = stage === 'waveform'
              ? Array.from({ length: 80 }, () => Math.random())
              : (get().currentJob?.waveform ?? []);

            // Set bitrates
            const bitrates = { ...get().currentJob?.bitrates };
            if (stage === 'transcoding_320' && i === steps) bitrates['320kbps'] = true;
            if (stage === 'transcoding_160' && i === steps) bitrates['160kbps'] = true;
            if (stage === 'transcoding_96' && i === steps) bitrates['96kbps'] = true;

            set(state => ({
              currentJob: state.currentJob ? {
                ...state.currentJob,
                overallProgress: Math.min(95, overall),
                stageProgress: Math.round((i / steps) * 100),
                waveform,
                bitrates: bitrates as UploadJob['bitrates'],
              } : null
            }));
          }
        }

        // Done
        const trackId = `${id}-published`;
        set(state => ({
          currentJob: state.currentJob ? {
            ...state.currentJob,
            stage: 'done',
            overallProgress: 100,
            stageProgress: 100,
            publishedTrackId: trackId,
            uploadedAt: new Date().toISOString(),
          } : null,
          isProcessing: false,
          uploadHistory: state.currentJob
            ? (() => {
                const { audioUrl, ...rest } = state.currentJob;
                const historyItem: Omit<UploadJob, 'audioUrl'> = {
                  ...rest,
                  id,
                  stage: 'done' as UploadStage,
                  uploadedAt: new Date().toISOString()
                };
                return [historyItem, ...state.uploadHistory].slice(0, 50);
              })()
            : state.uploadHistory,
        }));

        return trackId;
      },

      cancelUpload: () => set({ currentJob: null, isProcessing: false }),
      reset: () => set({ currentJob: null, isProcessing: false }),
    }),
    {
      name: 'beato-uploads',
      partialize: state => ({ uploadHistory: state.uploadHistory }),
    }
  )
);

export { STAGE_ORDER, STAGE_LABELS };
