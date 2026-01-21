export interface ProcessedLog {
  extractedContent: string;
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
  suggestedFilename: string;
}

export enum ProcessingState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING', // Gemini is thinking
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface AppConfig {
  geminiApiKey: string;
  googleClientId: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}