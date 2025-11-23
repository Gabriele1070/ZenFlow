export enum AppState {
  IDLE = 'IDLE',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  READY_TO_PLAY = 'READY_TO_PLAY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

export interface MeditationSession {
  topic: string;
  script: string;
  durationApprox: string;
}

export interface AudioState {
  isPlaying: boolean;
  isLoadingAudio: boolean;
  hasAudio: boolean;
  currentTime: number;
  duration: number;
}
