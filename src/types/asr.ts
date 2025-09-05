// ASR 相关类型定义

export type ASRStatus = 'UNDEFINED' | 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export interface ASRConfig {
  appId: string;
  apiKey: string;
  sampleRate?: number;
  frameSize?: number;
}

export interface ASRResult {
  action: 'started' | 'result' | 'error';
  data?: string;
  error?: string;
}

export interface RecognitionResult {
  cn: {
    st: {
      type: number; // 0: 最终结果, 1: 临时结果
      rt: Array<{
        ws: Array<{
          cw: Array<{
            w: string; // 识别的文字
          }>;
        }>;
      }>;
    };
  };
}

export interface RecorderManager {
  onStart?: () => void;
  onStop?: () => void;
  onFrameRecorded?: (data: { isLastFrame: boolean; frameBuffer: ArrayBuffer }) => void;
  start: (config: { sampleRate: number; frameSize: number }) => void;
  stop: () => void;
}

export interface ASRComponentProps {
  config: ASRConfig;
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: ASRStatus) => void;
  className?: string;
}
