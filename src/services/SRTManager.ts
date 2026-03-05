/**
 * V-Streaming SRT Protocol Manager
 * Secure Reliable Transport for unstable connections
 */

import { EventEmitter } from 'eventemitter3';
import type {
  SRTConfig,
  SRTStatistics,
  SRTConnectionStatus,
  SRTConnectionInfo,
  SRTError,
  SRTQualityMetrics,
  SRTConnectionMode,
  SRTEncryptionType,
  SRTEvents,
  ISRTManager,
} from '../types/srt';
import {
  defaultSRTConfig,
  SRTConnectionStatus as ConnectionStatus,
  SRTConnectionMode as ConnMode,
  SRTLatencyMode,
  SRTTransmissionType,
  SRTEncryptionType as EncType,
} from '../types/srt';

export class SRTManager extends EventEmitter<SRTEvents> implements ISRTManager {
  private static instance: SRTManager;

  private config: SRTConfig;
  private status: SRTConnectionStatus = ConnectionStatus.DISCONNECTED;
  private connectionInfo: SRTConnectionInfo | null = null;
  private statistics: SRTStatistics;
  private qualityMetrics: SRTQualityMetrics;
  private errorHistory: SRTError[] = [];
  private statsUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionStartTime = 0;

  private constructor() {
    super();
    this.config = this.loadConfig();
    this.statistics = this.initializeStatistics();
    this.qualityMetrics = this.initializeQualityMetrics();
  }

  public static getInstance(): SRTManager {
    if (!SRTManager.instance) {
      SRTManager.instance = new SRTManager();
    }
    return SRTManager.instance;
  }

  private loadConfig(): SRTConfig {
    try {
      const saved = localStorage.getItem('srt_config');
      if (saved) {
        return { ...defaultSRTConfig, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load SRT config:', error);
    }
    return { ...defaultSRTConfig };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('srt_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save SRT config:', error);
    }
  }

  private initializeStatistics(): SRTStatistics {
    return {
      status: this.status,
      uptime: 0,
      reconnectCount: 0,
      lastReconnectTime: 0,
      averageBitrate: 0,
      currentBitrate: 0,
      droppedFrames: 0,
      totalFrames: 0,
      networkLatency: 0,
      jitter: 0,
      packetLoss: 0,
      qualityMetrics: this.initializeQualityMetrics(),
      timestamp: Date.now(),
    };
  }

  private initializeQualityMetrics(): SRTQualityMetrics {
    return {
      rtt: 0,
      msRTT: 0,
      pktFlightSize: 0,
      flowWindowSize: 0,
      linkBandwidth: 0,
      mbpsBandwidth: 0,
      packetsSent: 0,
      packetsReceived: 0,
      packetsLost: 0,
      packetsRetransmitted: 0,
      packetRecvDrop: 0,
      packetSndDrop: 0,
      byteRecv: 0,
      byteSent: 0,
      byteAvailRcvBuf: 0,
      byteAvailSndBuf: 0,
    };
  }

  public getConfig(): SRTConfig {
    return { ...this.config };
  }

  public async setConfig(config: Partial<SRTConfig>): Promise<void> {
    if (this.status === ConnectionStatus.CONNECTED || this.status === ConnectionStatus.CONNECTING) {
      throw new Error('Cannot change configuration while connected');
    }

    this.config = { ...this.config, ...config };
    this.saveConfig();
    this.emit('configChanged', this.config);
  }

  public getStatus(): SRTConnectionStatus {
    return this.status;
  }

  public getStatistics(): SRTStatistics {
    return { ...this.statistics };
  }

  public getConnectionInfo(): SRTConnectionInfo | null {
    return this.connectionInfo ? { ...this.connectionInfo } : null;
  }

  public async connect(host: string, port: number): Promise<void> {
    if (this.status === ConnectionStatus.CONNECTED || this.status === ConnectionStatus.CONNECTING) {
      throw new Error('Already connected or connecting');
    }

    this.setStatus(ConnectionStatus.CONNECTING);
    this.connectionStartTime = Date.now();

    try {
      // Initialize connection via Tauri command
      // await invoke('srt_connect', { host, port, config: this.config });

      // Simulate connection
      await this.simulateConnection(host, port);

      this.connectionInfo = {
        id: `srt-${Date.now()}`,
        localAddress: '0.0.0.0',
        localPort: 0,
        remoteAddress: host,
        remotePort: port,
        mode: this.config.mode,
        status: ConnectionStatus.CONNECTED,
        connectedAt: Date.now(),
        lastActivity: Date.now(),
      };

      this.setStatus(ConnectionStatus.CONNECTED);
      this.reconnectAttempts = 0;
      this.startStatisticsUpdates();
    } catch (error) {
      const srtError: SRTError = {
        type: 'connection',
        code: 1,
        message: 'Failed to establish SRT connection',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        recoverable: true,
      };
      this.errorHistory.push(srtError);
      this.setStatus(ConnectionStatus.ERROR);
      this.emit('error', srtError);

      // Attempt reconnection if configured
      if (this.reconnectAttempts < this.config.reconnectAttempts) {
        this.attemptReconnect(host, port);
      }

      throw srtError;
    }
  }

  private async simulateConnection(host: string, port: number): Promise<void> {
    // Simulate connection delay
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve(undefined);
        } else {
          reject(new Error('Connection timeout'));
        }
      }, 500 + Math.random() * 1000);
    });
  }

  public async disconnect(): Promise<void> {
    if (this.status === ConnectionStatus.DISCONNECTED) {
      return;
    }

    this.setStatus(ConnectionStatus.DISCONNECTED);

    // Stop statistics updates
    this.stopStatisticsUpdates();

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      // Disconnect via Tauri command
      // await invoke('srt_disconnect');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }

    this.connectionInfo = null;
    this.reconnectAttempts = 0;
  }

  public isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  public isConnecting(): boolean {
    return this.status === ConnectionStatus.CONNECTING;
  }

  public resetToDefaults(): void {
    if (this.status === ConnectionStatus.CONNECTED || this.status === ConnectionStatus.CONNECTING) {
      throw new Error('Cannot reset configuration while connected');
    }

    this.config = { ...defaultSRTConfig };
    this.saveConfig();
    this.emit('configChanged', this.config);
  }

  public getSupportedModes(): SRTConnectionMode[] {
    return [ConnMode.CALLER, ConnMode.LISTENER, ConnMode.RENDEZVOUS];
  }

  public getSupportedEncryptions(): SRTEncryptionType[] {
    return [EncType.NONE, EncType.AES128, EncType.AES192, EncType.AES256];
  }

  public getErrorHistory(): SRTError[] {
    return [...this.errorHistory];
  }

  public clearErrorHistory(): void {
    this.errorHistory = [];
  }

  private setStatus(status: SRTConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statistics.status = status;
      this.emit('statusChanged', status);
    }
  }

  private attemptReconnect(host: string, port: number): void {
    this.reconnectAttempts++;
    this.setStatus(ConnectionStatus.RECONNECTING);
    this.emit('reconnecting', this.reconnectAttempts, this.config.reconnectAttempts);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect(host, port);
        this.emit('reconnected');
      } catch {
        // Error already handled in connect()
      }
    }, this.config.reconnectDelay * 1000);
  }

  private startStatisticsUpdates(): void {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
    }

    this.statsUpdateInterval = setInterval(() => {
      this.updateStatistics();
    }, this.config.statisticsInterval);
  }

  private stopStatisticsUpdates(): void {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }
  }

  private updateStatistics(): void {
    if (this.status !== ConnectionStatus.CONNECTED) {
      return;
    }

    const now = Date.now();
    const elapsed = (now - this.connectionStartTime) / 1000;

    // Simulate statistics from SRT
    // In production, these would come from Tauri commands
    this.qualityMetrics.rtt = 20 + Math.random() * 30;
    this.qualityMetrics.msRTT = this.qualityMetrics.rtt;
    this.qualityMetrics.pktFlightSize = Math.floor(10 + Math.random() * 50);
    this.qualityMetrics.flowWindowSize = 1024;
    this.qualityMetrics.linkBandwidth = 10 + Math.random() * 5;
    this.qualityMetrics.mbpsBandwidth = this.qualityMetrics.linkBandwidth;

    this.qualityMetrics.packetsSent += Math.floor(100 + Math.random() * 50);
    this.qualityMetrics.packetsReceived += Math.floor(95 + Math.random() * 45);
    this.qualityMetrics.packetsLost += Math.floor(Math.random() * 2);
    this.qualityMetrics.packetsRetransmitted += Math.floor(Math.random() * 2);
    this.qualityMetrics.packetRecvDrop += Math.floor(Math.random());
    this.qualityMetrics.packetSndDrop += Math.floor(Math.random());

    this.qualityMetrics.byteSent += this.qualityMetrics.packetsSent * this.config.pktSize;
    this.qualityMetrics.byteRecv += this.qualityMetrics.packetsReceived * this.config.pktSize;
    this.qualityMetrics.byteAvailRcvBuf = this.config.rcvBufSize - this.qualityMetrics.byteRecv;
    this.qualityMetrics.byteAvailSndBuf = this.config.sndBufSize - this.qualityMetrics.byteSent;

    this.statistics.uptime = elapsed;
    this.statistics.currentBitrate = this.qualityMetrics.mbpsBandwidth;
    this.statistics.averageBitrate = this.calculateAverageBitrate();
    this.statistics.networkLatency = this.qualityMetrics.rtt;
    this.statistics.jitter = Math.random() * 5;
    this.statistics.packetLoss = this.calculatePacketLoss();
    this.statistics.totalFrames = this.qualityMetrics.packetsSent;
    this.statistics.droppedFrames = this.qualityMetrics.packetsLost;
    this.statistics.qualityMetrics = { ...this.qualityMetrics };
    this.statistics.timestamp = now;

    // Adaptive bitrate adjustment
    if (this.config.adaptiveBitrate.enabled) {
      this.adjustAdaptiveBitrate();
    }

    this.emit('statisticsUpdated', this.statistics);
  }

  private calculateAverageBitrate(): number {
    const elapsed = (Date.now() - this.connectionStartTime) / 1000;
    if (elapsed <= 0) return 0;
    return (this.qualityMetrics.byteSent * 8) / (elapsed * 1000000);
  }

  private calculatePacketLoss(): number {
    const total = this.qualityMetrics.packetsSent + this.qualityMetrics.packetsLost;
    if (total <= 0) return 0;
    return (this.qualityMetrics.packetsLost / total) * 100;
  }

  private adjustAdaptiveBitrate(): void {
    const { adaptiveBitrate } = this.config;
    const currentLoss = this.statistics.packetLoss;

    if (currentLoss > adaptiveBitrate.targetLoss) {
      // Decrease bitrate
      const newBitrate = Math.max(
        adaptiveBitrate.minBitrate,
        this.statistics.currentBitrate - adaptiveBitrate.adjustmentStep
      );
      if (newBitrate !== this.statistics.currentBitrate) {
        this.emit('adaptiveBitrateChanged', newBitrate);
      }
    } else if (currentLoss < adaptiveBitrate.targetLoss * 0.5) {
      // Increase bitrate
      const newBitrate = Math.min(
        adaptiveBitrate.maxBitrate,
        this.statistics.currentBitrate + adaptiveBitrate.adjustmentStep
      );
      if (newBitrate !== this.statistics.currentBitrate) {
        this.emit('adaptiveBitrateChanged', newBitrate);
      }
    }
  }
}

// Export singleton instance
export const srtManager = SRTManager.getInstance();