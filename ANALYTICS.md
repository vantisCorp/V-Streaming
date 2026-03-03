# V-Streaming Analytics Dashboard

## Overview

The Analytics Dashboard module provides comprehensive real-time and historical analytics for stream performance, viewer engagement, revenue tracking, and system metrics.

## Features

### Real-Time Analytics
- **Current Viewers**: Live viewer count with instant updates
- **Chat Activity**: Messages per minute tracking
- **Stream Health**: Bitrate, FPS, and dropped frames monitoring
- **System Resources**: CPU, GPU, and memory usage
- **Stream Uptime**: Live duration tracking

### Historical Data
- **Aggregation Periods**: Minute, 5-minute, 15-minute, hour, 6-hour, day, week, month
- **Trend Analysis**: Compare current vs previous periods
- **Performance History**: Track metrics over time

### Viewer Statistics
- **Unique Viewers**: Total unique viewers during stream
- **Average Watch Time**: Mean viewer retention
- **Returning vs New Viewers**: Audience composition
- **Retention Rate**: Percentage of viewers who stay
- **Chat Participation**: Engagement metrics

### Revenue Tracking
- **Tips**: Direct donations from viewers
- **Subscriptions**: Recurring revenue tracking
- **Bits/Cheers**: Platform-specific currencies
- **Sponsorships**: Brand deals and partnerships
- **Merchandise**: Product sales

### Performance Metrics
- **Stream Health Score**: Overall quality indicator (0-100)
- **Bitrate Stability**: Network consistency
- **FPS Stability**: Frame rate consistency
- **Dropped Frame Rate**: Quality issues
- **CPU/GPU Efficiency**: Resource utilization

## API Reference

### Tauri Commands

#### Get Real-Time Analytics
```typescript
import { invoke } from '@tauri-apps/api/tauri';

const realTimeData = await invoke<RealTimeAnalytics>('analytics_get_real_time');
```

Returns:
```typescript
interface RealTimeAnalytics {
  current_viewers: number;
  chat_messages_per_minute: number;
  current_bitrate: number;
  current_fps: number;
  dropped_frames_last_minute: number;
  stream_uptime: number;
  live_status: boolean;
  last_update: string;
}
```

#### Get Aggregated Analytics
```typescript
const aggregated = await invoke<AggregatedAnalytics>('analytics_get_aggregated', {
  period: 'hour' // 'minute' | 'five_minutes' | 'fifteen_minutes' | 'hour' | 'six_hours' | 'day' | 'week' | 'month'
});
```

Returns:
```typescript
interface AggregatedAnalytics {
  period: string;
  start_time: string;
  end_time: string;
  avg_viewers: number;
  peak_viewers: number;
  avg_bitrate: number;
  avg_fps: number;
  total_dropped_frames: number;
  avg_cpu: number;
  avg_memory: number;
  avg_gpu: number;
  total_chat_messages: number;
  total_followers: number;
  total_donations: number;
  stream_duration: number;
  uptime: number;
}
```

#### Get Performance Metrics
```typescript
const metrics = await invoke<PerformanceMetrics>('analytics_get_performance_metrics');
```

Returns:
```typescript
interface PerformanceMetrics {
  stream_health_score: number; // 0-100
  bitrate_stability: number;
  fps_stability: number;
  dropped_frame_rate: number;
  cpu_efficiency: number;
  gpu_efficiency: number;
  network_quality_score: number;
}
```

#### Get Viewer Statistics
```typescript
const viewerStats = await invoke<ViewerStatistics>('analytics_get_viewer_statistics');
```

Returns:
```typescript
interface ViewerStatistics {
  total_unique_viewers: number;
  average_watch_time: number;
  returning_viewers: number;
  new_viewers: number;
  viewer_retention_rate: number;
  peak_concurrent_viewers: number;
  chat_participation_rate: number;
}
```

#### Get Revenue Statistics
```typescript
const revenue = await invoke<RevenueStatistics>('analytics_get_revenue_statistics');
```

Returns:
```typescript
interface RevenueStatistics {
  total_tips: number;
  total_subscriptions: number;
  total_bits: number;
  total_sponsorships: number;
  total_merchandise: number;
  average_revenue_per_viewer: number;
  revenue_growth_rate: number;
  top_donors: DonorInfo[];
}
```

#### Update Real-Time Data
```typescript
await invoke('analytics_update_real_time', {
  data: {
    current_viewers: 1500,
    chat_messages_per_minute: 45,
    current_bitrate: 6000,
    current_fps: 60,
    dropped_frames_last_minute: 2,
    stream_uptime: 7200,
    live_status: true,
    last_update: new Date().toISOString()
  }
});
```

#### Add Data Point
```typescript
await invoke('analytics_add_data_point', {
  data: {
    timestamp: new Date().toISOString(),
    viewers: 1500,
    bitrate: 6000,
    fps: 60,
    dropped_frames: 2,
    cpu_usage: 45.5,
    memory_usage: 60.2,
    gpu_usage: 70.1,
    network_up: 6.5,
    chat_messages: 45,
    new_followers: 12,
    donations: 25.50
  }
});
```

#### Export Data
```typescript
const csvData = await invoke<string>('analytics_export_data', {
  format: 'csv', // 'json' | 'csv'
  period: 'day'
});
```

## Frontend Component Usage

```tsx
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

function App() {
  return (
    <div className="app">
      <AnalyticsDashboard />
    </div>
  );
}
```

### Props
The AnalyticsDashboard component is self-contained and doesn't require props.

### Features
- **Auto-refresh**: Updates every 5 seconds
- **Tabbed Interface**: Overview, Viewers, Performance, Revenue, Alerts
- **Time Period Selection**: Hour, Day, Week, Month views
- **Live Status Indicator**: Shows stream status and uptime
- **Interactive Charts**: Using Chart.js for data visualization

## Alerts System

### Alert Types
- `HighViewerCount`: Triggered when viewers exceed threshold
- `LowBitrate`: Warns when bitrate drops below threshold
- `HighDroppedFrames`: Alerts on frame drop rate exceeding limit
- `HighCpuUsage`: CPU usage warnings
- `HighMemoryUsage`: Memory usage warnings
- `DonationReceived`: New donation notifications
- `FollowerMilestone`: Follower count achievements
- `StreamDisconnected`: Stream interruption alerts
- `PerformanceDegraded`: Overall quality issues

### Alert Configuration
```rust
let config = AlertConfig {
    viewer_count_threshold: Some(1000),
    low_bitrate_threshold: Some(3000),
    high_dropped_frames_threshold: Some(5.0),
    high_cpu_threshold: Some(90.0),
    donation_threshold: Some(100.0),
    enable_email_alerts: true,
    enable_push_notifications: true,
};
```

## Data Export

### Supported Formats
- **JSON**: Structured data export
- **CSV**: Spreadsheet-compatible format
- **Excel**: (Planned) Native Excel format
- **PDF**: (Planned) Report generation

### Export Example
```rust
// Export as CSV
let csv = engine.export_data(ExportFormat::Csv, AggregationPeriod::Day)?;

// Export as JSON
let json = engine.export_data(ExportFormat::Json, AggregationPeriod::Week)?;
```

## Architecture

### Backend (Rust)
- `src-tauri/src/analytics.rs`: Core analytics engine
- `src-tauri/src/analytics_commands.rs`: Tauri command handlers

### Frontend (TypeScript/React)
- `src/components/AnalyticsDashboard.tsx`: Main dashboard component
- Chart.js for data visualization
- Real-time updates via Tauri IPC

## Performance Considerations

- **Memory Management**: Maximum 10,000 data points stored
- **Aggregation**: Data is aggregated lazily on request
- **Thread Safety**: Uses RwLock for concurrent access
- **Auto-Cleanup**: Old data points and alerts are automatically removed

## Future Enhancements

1. **Predictive Analytics**: ML-based predictions for viewer growth
2. **Custom Dashboards**: User-configurable widget layouts
3. **Export Templates**: Pre-formatted report templates
4. **Team Analytics**: Multi-streamer team statistics
5. **API Integration**: Connect with streaming platform APIs
6. **Real-time Collaboration**: Share dashboards with team members

## Dependencies

### Rust
- `serde`: Serialization
- `chrono`: Date/time handling
- `tokio`: Async runtime

### Frontend
- `react-chartjs-2`: React Chart.js wrapper
- `chart.js`: Charting library
- `@tauri-apps/api`: Tauri API bindings

## License

Part of the V-Streaming project. See LICENSE for details.