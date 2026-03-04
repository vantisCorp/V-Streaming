export interface StreamStatus {
  is_streaming: boolean;
  platform: 'twitch' | 'youtube' | 'facebook' | 'tiktok' | 'kick' | 'rumble';
  viewer_count: number;
  duration: number;
  fps: number;
  bitrate: number;
}

export interface Scene {
  id: string;
  name: string;
  thumbnail?: string;
  active: boolean;
}

export interface AudioTrack {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  meter: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  color?: string;
  badges?: string[];
}

export interface Notification {
  id: string;
  type: 'follower' | 'subscriber' | 'donation' | 'raid' | 'host';
  title: string;
  message: string;
  timestamp: Date;
}

export interface AnalyticsData {
  viewers: number;
  new_followers: number;
  subscribers: number;
  donations: number;
  chat_messages: number;
}

export interface VTuberModel {
  id: string;
  name: string;
  model_path: string;
  active: boolean;
  expressions: string[];
}

export interface AppSettings {
  desktop_ip: string;
  desktop_port: number;
  auto_reconnect: boolean;
  notification_enabled: boolean;
}