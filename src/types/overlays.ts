/**
 * Overlay and Widget Types for V-Streaming
 */

export type OverlayType = 
  | 'image' 
  | 'text' 
  | 'shape' 
  | 'browser' 
  | 'widget' 
  | 'animation' 
  | 'video' 
  | 'camera' 
  | 'group';

export type WidgetType =
  | 'chat'
  | 'social'
  | 'donation'
  | 'goal'
  | 'poll'
  | 'timer'
  | 'countdown'
  | 'weather'
  | 'clock'
  | 'subcount'
  | 'viewercount'
  | 'followergoal'
  | 'schedule'
  | 'music'
  | 'news';

export type OverlayEffect =
  | 'none'
  | 'fade'
  | 'slide'
  | 'bounce'
  | 'pulse'
  | 'rotate'
  | 'scale'
  | 'flip'
  | 'shake';

export type OverlayEffectTrigger =
  | 'onLoad'
  | 'onHover'
  | 'onClick'
  | 'onStreamStart'
  | 'onEvent'
  | 'manual';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
}

export interface BorderRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface BoxShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
}

export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface Animation {
  name: string;
  duration: number;
  delay: number;
  iterations: number;
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode: 'none' | 'forwards' | 'backwards' | 'both';
  easing: string;
}

export interface Effect {
  type: OverlayEffect;
  trigger: OverlayEffectTrigger;
  duration: number;
  delay: number;
  animation?: Animation;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Gradient {
  type: 'linear' | 'radial' | 'conic';
  colors: Color[];
  stops: number[];
  angle?: number;
  position?: Position;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic' | 'oblique';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  color: Color;
  backgroundColor?: Color;
  textShadow?: TextShadow;
  textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
}

export interface BorderStyle {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
  color: Color;
  radius: BorderRadius;
}

export interface BackgroundStyle {
  type: 'color' | 'gradient' | 'image' | 'transparent';
  color?: Color;
  gradient?: Gradient;
  imageUrl?: string;
  opacity: number;
}

export interface OverlayLayer {
  id: string;
  name: string;
  type: OverlayType;
  position: Position;
  size: Size;
  transform: Transform;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  effects: Effect[];
  mask?: string;
}

export interface ImageOverlay extends OverlayLayer {
  type: 'image';
  imageUrl: string;
  fit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y' | 'space' | 'round';
}

export interface TextOverlay extends OverlayLayer {
  type: 'text';
  text: string;
  style: TextStyle;
  background: BackgroundStyle;
  border: BorderStyle;
  padding: { top: number; right: number; bottom: number; left: number };
}

export interface ShapeOverlay extends OverlayLayer {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'triangle' | 'star' | 'polygon';
  sides?: number;
  fill: BackgroundStyle;
  border: BorderStyle;
}

export interface BrowserOverlay extends OverlayLayer {
  type: 'browser';
  url: string;
  width: number;
  height: number;
  zoom: number;
  customCSS?: string;
  customJS?: string;
}

export interface WidgetOverlay extends OverlayLayer {
  type: 'widget';
  widgetType: WidgetType;
  config: WidgetConfig;
}

export interface AnimationOverlay extends OverlayLayer {
  type: 'animation';
  format: 'gif' | 'apng' | 'webp' | 'mp4' | 'webm';
  url: string;
  loop: boolean;
  autoplay: boolean;
  speed: number;
}

export interface VideoOverlay extends OverlayLayer {
  type: 'video';
  url: string;
  loop: boolean;
  autoplay: boolean;
  muted: boolean;
  controls: boolean;
  speed: number;
}

export interface CameraOverlay extends OverlayLayer {
  type: 'camera';
  deviceId?: string;
  deviceIdV2?: string;
}

export interface GroupOverlay extends OverlayLayer {
  type: 'group';
  children: string[];
}

export type Overlay = 
  | ImageOverlay 
  | TextOverlay 
  | ShapeOverlay 
  | BrowserOverlay 
  | WidgetOverlay 
  | AnimationOverlay 
  | VideoOverlay 
  | CameraOverlay 
  | GroupOverlay;

export interface OverlayScene {
  id: string;
  name: string;
  description: string;
  layers: Overlay[];
  preview?: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  theme: string;
  colors: Record<string, Color>;
  fonts: Record<string, TextStyle>;
  layout: 'horizontal' | 'vertical' | 'grid' | 'custom';
  showHeader: boolean;
  showBorder: boolean;
  borderRadius: number;
  boxShadow?: BoxShadow;
  backgroundColor?: Color;
  transparent: boolean;
  animation?: Effect;
  refreshInterval?: number;
  maxItems?: number;
  hideEmpty: boolean;
}

export interface WidgetData {
  type: WidgetType;
  items: any[];
  total?: number;
  goal?: number;
  title?: string;
  subtitle?: string;
  lastUpdated: Date;
}

export interface OverlayTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  thumbnail: string;
  author: string;
  version: string;
  tags: string[];
  scene: OverlayScene;
  dependencies: string[];
  customData?: Record<string, any>;
  downloads: number;
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceFilter {
  category?: string;
  tags?: string[];
  author?: string;
  minRating?: number;
  minDownloads?: number;
  sortBy?: 'popular' | 'newest' | 'rating' | 'downloads' | 'name';
  searchQuery?: string;
}

export interface MarketplaceStats {
  totalTemplates: number;
  totalDownloads: number;
  totalAuthors: number;
  totalCategories: number;
  popularTemplates: OverlayTemplate[];
  recentlyUpdated: OverlayTemplate[];
}

export interface OverlaySettings {
  enableOverlays: boolean;
  autoSave: boolean;
  saveInterval: number;
  autoBackup: boolean;
  backupInterval: number;
  maxBackups: number;
  enableCache: boolean;
  cacheSize: number;
  enablePreview: boolean;
  previewQuality: 'low' | 'medium' | 'high';
  enableEffects: boolean;
  maxEffectsPerLayer: number;
  enableAnimations: boolean;
  maxAnimationsPerLayer: number;
  defaultOpacity: number;
  defaultZIndex: number;
}

export interface OverlayEditorState {
  selectedLayerId: string | null;
  clipboard: Overlay | null;
  history: OverlayScene[];
  historyIndex: number;
  gridVisible: boolean;
  gridSize: number;
  snapToGrid: boolean;
  rulerVisible: boolean;
  zoom: number;
  pan: Position;
}

export const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  enableOverlays: true,
  autoSave: true,
  saveInterval: 30000,
  autoBackup: true,
  backupInterval: 300000,
  maxBackups: 10,
  enableCache: true,
  cacheSize: 100 * 1024 * 1024, // 100MB
  enablePreview: true,
  previewQuality: 'medium',
  enableEffects: true,
  maxEffectsPerLayer: 10,
  enableAnimations: true,
  maxAnimationsPerLayer: 5,
  defaultOpacity: 1.0,
  defaultZIndex: 0,
};

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  theme: 'default',
  colors: {
    primary: { r: 147, g: 51, b: 234, a: 1 },
    secondary: { r: 59, g: 130, b: 246, a: 1 },
    background: { r: 17, g: 24, b: 39, a: 1 },
    text: { r: 255, g: 255, b: 255, a: 1 },
    border: { r: 71, g: 85, b: 105, a: 1 },
  },
  fonts: {
    title: {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 700,
      fontStyle: 'normal',
      textAlign: 'center',
      textTransform: 'none',
      lineHeight: 1.2,
      letterSpacing: 0,
      wordSpacing: 0,
      color: { r: 255, g: 255, b: 255, a: 1 },
    },
    body: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      fontStyle: 'normal',
      textAlign: 'left',
      textTransform: 'none',
      lineHeight: 1.5,
      letterSpacing: 0,
      wordSpacing: 0,
      color: { r: 255, g: 255, b: 255, a: 1 },
    },
  },
  layout: 'vertical',
  showHeader: true,
  showBorder: true,
  borderRadius: 8,
  transparent: false,
  hideEmpty: false,
};

export const OVERLAY_CATEGORIES = [
  'Gaming',
  'IRL',
  'Music',
  'Art',
  'Education',
  'Sports',
  'News',
  'Entertainment',
  'Technology',
  'Business',
  'Lifestyle',
  'Travel',
  'Food',
  'Comedy',
  'Gaming Tools',
  'Chat Widgets',
  'Social Media',
  'Goal Meters',
  'Alerts',
  'Transitions',
];

export const WIDGET_TYPES: { type: WidgetType; label: string; description: string }[] = [
  { type: 'chat', label: 'Chat', description: 'Display live chat messages' },
  { type: 'social', label: 'Social Media', description: 'Social media links and follower counts' },
  { type: 'donation', label: 'Donation', description: 'Recent donations and tips' },
  { type: 'goal', label: 'Goal', description: 'Progress towards a goal' },
  { type: 'poll', label: 'Poll', description: 'Interactive poll widget' },
  { type: 'timer', label: 'Timer', description: 'Count-up timer' },
  { type: 'countdown', label: 'Countdown', description: 'Countdown to an event' },
  { type: 'weather', label: 'Weather', description: 'Current weather information' },
  { type: 'clock', label: 'Clock', description: 'Current time display' },
  { type: 'subcount', label: 'Subscriber Count', description: 'Live subscriber count' },
  { type: 'viewercount', label: 'Viewer Count', description: 'Live viewer count' },
  { type: 'followergoal', label: 'Follower Goal', description: 'Progress towards follower goal' },
  { type: 'schedule', label: 'Schedule', description: 'Upcoming stream schedule' },
  { type: 'music', label: 'Music', description: 'Currently playing music' },
  { type: 'news', label: 'News', description: 'Latest news ticker' },
];