/**
 * V-Streaming SRT Protocol Type Definitions
 * Secure Reliable Transport for unstable connections
 */

import type EventEmitter from 'eventemitter3';

// SRT connection modes
export enum SRTConnectionMode {
  CALLER = 'caller',
  LISTENER = 'listener',
  RENDEZVOUS = 'rendezvous',
}

// SRT latency modes
export enum SRTLatencyMode {
  LIVE = 'live',
  ONDEMAND = 'ondemand',
}

// SRT transmission types
export enum SRTTransmissionType {
  LIVE = 'live',
  FILE = 'file',
}

// SRT encryption types
export enum SRTEncryptionType {
  NONE = 'none',
  AES128 = 'aes-128',
  AES192 = 'aes-192',
  AES256 = 'aes-256',
}

// SRT connection status
export enum SRTConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// SRT quality metrics
export interface SRTQualityMetrics {
  rtt: number; // Round-trip time in ms
  msRTT: number; // Estimated round-trip time in ms
  pktFlightSize: number; // Packets in flight
  flowWindowSize: number; // Flow window size
  linkBandwidth: number; // Link bandwidth in Mbps
  mbpsBandwidth: number; // Measured bandwidth in Mbps
  packetsSent: number;
  packetsReceived: number;
  packetsLost: number;
  packetsRetransmitted: number;
  packetRecvDrop: number;
  packetSndDrop: number;
  byteRecv: number;
  byteSent: number;
  byteAvailRcvBuf: number;
  byteAvailSndBuf: number;
}

// SRT statistics
export interface SRTStatistics {
  status: SRTConnectionStatus;
  uptime: number; // in seconds
  reconnectCount: number;
  lastReconnectTime: number;
  averageBitrate: number; // in Mbps
  currentBitrate: number; // in Mbps
  droppedFrames: number;
  totalFrames: number;
  networkLatency: number; // in ms
  jitter: number; // in ms
  packetLoss: number; // percentage
  qualityMetrics: SRTQualityMetrics;
  timestamp: number;
}

// SRT configuration
export interface SRTConfig {
  mode: SRTConnectionMode;
  latencyMode: SRTLatencyMode;
  transmissionType: SRTTransmissionType;
  encryption: {
    enabled: boolean;
    type: SRTEncryptionType;
    passphrase: string;
  };
  latency: number; // in ms
  peerLatency: number; // in ms
  maxBW: number; // maximum bandwidth in Mbps (-1 for unlimited)
  inputBW: number; // input bandwidth in Mbps (-1 for default)
  oheadBW: number; // percentage of over-bandwidth
  streamID: string;
  pktSize: number; // packet size in bytes
  rcvBufSize: number; // receive buffer size in bytes
  sndBufSize: number; // send buffer size in bytes
  maxReorderTolerance: number; // in packets
  ttldrop: number; // TTL drop threshold
  linger: number; // linger time in seconds
  statisticsInterval: number; // statistics update interval in ms
  reconnectAttempts: number;
  reconnectDelay: number; // in seconds
  adaptiveBitrate: {
    enabled: boolean;
    minBitrate: number; // in Mbps
    maxBitrate: number; // in Mbps
    targetLoss: number; // target packet loss percentage
    adjustmentStep: number; // adjustment step in Mbps
  };
}

// Default SRT configuration
export const defaultSRTConfig: SRTConfig = {
  mode: SRTConnectionMode.CALLER,
  latencyMode: SRTLatencyMode.LIVE,
  transmissionType: SRTTransmissionType.LIVE,
  encryption: {
    enabled: false,
    type: SRTEncryptionType.AES128,
    passphrase: '',
  },
  latency: 120,
  peerLatency: 120,
  maxBW: -1,
  inputBW: -1,
  oheadBW: 25,
  streamID: 'V-Streaming SRT',
  pktSize: 1316,
  rcvBufSize: 8192 * 1024,
  sndBufSize: 8192 * 1024,
  maxReorderTolerance: 32,
  ttldrop: 0,
  linger: 2,
  statisticsInterval: 1000,
  reconnectAttempts: 5,
  reconnectDelay: 3,
  adaptiveBitrate: {
    enabled: true,
    minBitrate: 1,
    maxBitrate: 10,
    targetLoss: 0.5,
    adjustmentStep: 0.5,
  },
};

// SRT connection info
export interface SRTConnectionInfo {
  id: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  mode: SRTConnectionMode;
  status: SRTConnectionStatus;
  connectedAt: number;
  lastActivity: number;
}

// SRT error
export interface SRTError {
  type: 'connection' | 'configuration' | 'encryption' | 'network' | 'generic';
  code: number;
  message: string;
  details?: string;
  timestamp: number;
  recoverable: boolean;
}

// SRT event types
export type SRTEventType =
  | 'statusChanged'
  | 'statisticsUpdated'
  | 'error'
  | 'configChanged'
  | 'reconnecting'
  | 'reconnected'
  | 'adaptiveBitrateChanged';

export interface SRTEvent {
  type: SRTEventType;
  data: unknown;
  timestamp: number;
}

// SRT events interface
export interface SRTEvents {
  statusChanged: (status: SRTConnectionStatus) => void;
  statisticsUpdated: (stats: SRTStatistics) => void;
  error: (error: SRTError) => void;
  configChanged: (config: SRTConfig) => void;
  reconnecting: (attempt: number, maxAttempts: number) => void;
  reconnected: () => void;
  adaptiveBitrateChanged: (bitrate: number) => void;
}

// SRT manager interface
export interface ISRTManager {
  getConfig(): SRTConfig;
  setConfig(config: Partial<SRTConfig>): Promise<void>;
  getStatus(): SRTConnectionStatus;
  getStatistics(): SRTStatistics;
  getConnectionInfo(): SRTConnectionInfo | null;
  connect(host: string, port: number): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  isConnecting(): boolean;
  resetToDefaults(): void;
  getSupportedModes(): SRTConnectionMode[];
  getSupportedEncryptions(): SRTEncryptionType[];
  getErrorHistory(): SRTError[];
  clearErrorHistory(): void;
}

// Export type for EventEmitter
export type SRTEventEmitter = EventEmitter<SRTEvents>;