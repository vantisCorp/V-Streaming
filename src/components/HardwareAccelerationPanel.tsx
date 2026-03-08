/**
 * Hardware Acceleration Panel Component
 * UI for managing GPU encoding/decoding and hardware acceleration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GPUVendor,
  HardwareEncoder,
  HardwareDecoder,
  EncoderPreset,
  RateControlMode,
  MultiPassMode,
  GPUDevice,
  HardwareEncoderSettings,
  GPUStatistics,
  BenchmarkResult
} from '../types/hardwareAcceleration';
import { useHardwareAcceleration } from '../hooks/useHardwareAcceleration';
import './HardwareAccelerationPanel.css';

type TabType = 'gpus' | 'encoder' | 'decoder' | 'benchmark';

const HardwareAccelerationPanel: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('gpus');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    isInitialized,
    isAvailable,
    status,
    config,
    gpuStats,
    selectGPU,
    setActiveEncoder,
    updateEncoderSettings,
    getEncoderSettings,
    setActiveDecoder,
    updateDecoderSettings,
    runBenchmark
  } = useHardwareAcceleration();

  // Local encoder settings state
  const [encoderSettings, setEncoderSettings] = useState<HardwareEncoderSettings>(
    getEncoderSettings()
  );

  // Benchmark state
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [benchmarkConfig, setBenchmarkConfig] = useState({
    resolution: '1920x1080',
    frameRate: 60,
    duration: 10
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Update local settings when service settings change
  useEffect(() => {
    setEncoderSettings(getEncoderSettings());
  }, [getEncoderSettings]);

  const handleGPUSelect = useCallback((gpuId: string) => {
    selectGPU(gpuId);
    setSuccess('GPU selected successfully');
  }, [selectGPU]);

  const handleEncoderChange = useCallback((encoder: HardwareEncoder) => {
    setActiveEncoder(encoder);
    setSuccess(`Encoder changed to ${encoder}`);
  }, [setActiveEncoder]);

  const handleSettingChange = useCallback(<K extends keyof HardwareEncoderSettings>(
    key: K,
    value: HardwareEncoderSettings[K]
  ) => {
    const newSettings = { ...encoderSettings, [key]: value };
    setEncoderSettings(newSettings);
    updateEncoderSettings({ [key]: value });
  }, [encoderSettings, updateEncoderSettings]);

  const handleDecoderChange = useCallback((decoder: HardwareDecoder) => {
    setActiveDecoder(decoder);
    setSuccess(`Decoder changed to ${decoder}`);
  }, [setActiveDecoder]);

  const handleBenchmark = useCallback(async () => {
    if (!status.activeGPU) {
      setError('Please select a GPU first');
      return;
    }

    setBenchmarkRunning(true);
    setBenchmarkProgress(0);
    setBenchmarkResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setBenchmarkProgress(prev => Math.min(prev + 10, 90));
    }, benchmarkConfig.duration * 100);

    try {
      const result = await runBenchmark(
        status.activeGPU.id,
        config.preferredEncoder,
        encoderSettings.preset,
        benchmarkConfig.resolution,
        benchmarkConfig.frameRate,
        benchmarkConfig.duration
      );

      setBenchmarkResult(result);
      setBenchmarkProgress(100);
      setSuccess('Benchmark completed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      clearInterval(progressInterval);
      setBenchmarkRunning(false);
    }
  }, [status.activeGPU, config.preferredEncoder, encoderSettings.preset, benchmarkConfig, runBenchmark]);

  const getGpuStats = (gpuId: string): GPUStatistics | undefined => {
    return gpuStats.find(s => s.gpuId === gpuId);
  };

  const getVendorIcon = (vendor: GPUVendor): string => {
    switch (vendor) {
      case GPUVendor.NVIDIA: return '🟢';
      case GPUVendor.AMD: return '🔴';
      case GPUVendor.INTEL: return '🔵';
      case GPUVendor.APPLE: return '⚪';
      default: return '⚫';
    }
  };

  const getVendorName = (vendor: GPUVendor): string => {
    switch (vendor) {
      case GPUVendor.NVIDIA: return 'NVIDIA';
      case GPUVendor.AMD: return 'AMD';
      case GPUVendor.INTEL: return 'Intel';
      case GPUVendor.APPLE: return 'Apple';
      default: return 'Unknown';
    }
  };

  const renderGPUTab = () => (
    <div className="hardware-tab-content">
      <h3>{t('hardware.gpus.title', 'GPU Devices')}</h3>

      {status.availableGPUs.length === 0 ? (
        <p className="hardware-empty-message">
          {t('hardware.gpus.noGPUs', 'No compatible GPUs detected')}
        </p>
      ) : (
        <div className="gpu-cards-grid">
          {status.availableGPUs.map(gpu => {
            const stats = getGpuStats(gpu.id);
            const isActive = status.activeGPU?.id === gpu.id;

            return (
              <div
                key={gpu.id}
                className={`gpu-card ${isActive ? 'active' : ''}`}
                onClick={() => handleGPUSelect(gpu.id)}
              >
                <div className="gpu-card-header">
                  <div className="gpu-vendor-logo">{getVendorIcon(gpu.vendor)}</div>
                  {isActive && (
                    <span className="status-badge available">
                      {t('hardware.gpus.active', 'Active')}
                    </span>
                  )}
                </div>
                <div className="gpu-name">{gpu.name}</div>
                <div className="gpu-driver">
                  {t('hardware.gpus.driver', 'Driver')}: {gpu.driverVersion}
                </div>

                <div className="gpu-stats">
                  <div className="gpu-stat">
                    <div className="gpu-stat-value">
                      {gpu.memory ? (gpu.memory / 1024).toFixed(1) : 0} GB
                    </div>
                    <div className="gpu-stat-label">{t('hardware.gpus.memory', 'VRAM')}</div>
                  </div>
                  <div className="gpu-stat">
                    <div className="gpu-stat-value">
                      {stats?.temperature?.toFixed(0) || gpu.temperature || 0}°C
                    </div>
                    <div className="gpu-stat-label">{t('hardware.gpus.temp', 'Temp')}</div>
                  </div>
                  <div className="gpu-stat">
                    <div className="gpu-stat-value">
                      {stats?.utilization?.toFixed(0) || gpu.utilization || 0}%
                    </div>
                    <div className="gpu-stat-label">{t('hardware.gpus.usage', 'Usage')}</div>
                  </div>
                </div>

                {stats && (
                  <div className="gpu-progress-bar">
                    <div
                      className={`gpu-progress-fill ${
                        stats.utilization > 80 ? 'high' : stats.utilization > 50 ? 'medium' : ''
                      }`}
                      style={{ width: `${stats.utilization}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderEncoderTab = () => (
    <div className="hardware-tab-content">
      <h3>{t('hardware.encoder.title', 'Encoder Settings')}</h3>

      <div className="encoder-settings-grid">
        <div className="encoder-setting-group">
          <h4>{t('hardware.encoder.basic', 'Basic Settings')}</h4>

          <div className="hardware-form-group">
            <label>{t('hardware.encoder.encoder', 'Encoder')}</label>
            <select
              value={encoderSettings.encoder}
              onChange={(e) => handleEncoderChange(e.target.value as HardwareEncoder)}
            >
              <optgroup label="NVIDIA NVENC">
                <option value={HardwareEncoder.NVENC_H264}>NVENC H.264</option>
                <option value={HardwareEncoder.NVENC_HEVC}>NVENC HEVC</option>
                <option value={HardwareEncoder.NVENC_AV1}>NVENC AV1</option>
              </optgroup>
              <optgroup label="AMD AMF">
                <option value={HardwareEncoder.AMF_H264}>AMF H.264</option>
                <option value={HardwareEncoder.AMF_HEVC}>AMF HEVC</option>
              </optgroup>
              <optgroup label="Intel QuickSync">
                <option value={HardwareEncoder.QSV_H264}>QSV H.264</option>
                <option value={HardwareEncoder.QSV_HEVC}>QSV HEVC</option>
              </optgroup>
              <optgroup label="Software">
                <option value={HardwareEncoder.SOFTWARE_X264}>x264 (CPU)</option>
                <option value={HardwareEncoder.SOFTWARE_X265}>x265 (CPU)</option>
              </optgroup>
            </select>
          </div>

          <div className="hardware-form-group">
            <label>{t('hardware.encoder.preset', 'Preset')}</label>
            <select
              value={encoderSettings.preset}
              onChange={(e) => handleSettingChange('preset', e.target.value as EncoderPreset)}
            >
              <option value={EncoderPreset.P1}>P1 - Fastest</option>
              <option value={EncoderPreset.P2}>P2 - Faster</option>
              <option value={EncoderPreset.P3}>P3 - Fast</option>
              <option value={EncoderPreset.P4}>P4 - Medium</option>
              <option value={EncoderPreset.P5}>P5 - Slow</option>
              <option value={EncoderPreset.P6}>P6 - Slower</option>
              <option value={EncoderPreset.P7}>P7 - Slowest (Best Quality)</option>
            </select>
          </div>

          <div className="hardware-form-group">
            <label>{t('hardware.encoder.rateControl', 'Rate Control')}</label>
            <select
              value={encoderSettings.rateControl}
              onChange={(e) => handleSettingChange('rateControl', e.target.value as RateControlMode)}
            >
              <option value={RateControlMode.CBR}>CBR (Constant Bitrate)</option>
              <option value={RateControlMode.VBR}>VBR (Variable Bitrate)</option>
              <option value={RateControlMode.CQP}>CQP (Constant QP)</option>
            </select>
          </div>
        </div>

        <div className="encoder-setting-group">
          <h4>{t('hardware.encoder.bitrate', 'Bitrate Settings')}</h4>

          <div className="hardware-form-group">
            <label>{t('hardware.encoder.bitrate', 'Target Bitrate (kbps)')}</label>
            <input
              type="number"
              value={encoderSettings.bitrate}
              onChange={(e) => handleSettingChange('bitrate', parseInt(e.target.value))}
              min={500}
              max={50000}
            />
          </div>

          <div className="hardware-form-group">
            <label>{t('hardware.encoder.minBitrate', 'Min Bitrate (kbps)')}</label>
            <input
              type="number"
              value={encoderSettings.minBitrate || 1000}
              onChange={(e) => handleSettingChange('minBitrate', parseInt(e.target.value))}
              min={100}
            />
          </div>

          <div className="hardware-form-group">
            <label>{t('hardware.encoder.maxBitrate', 'Max Bitrate (kbps)')}</label>
            <input
              type="number"
              value={encoderSettings.maxBitrate || 10000}
              onChange={(e) => handleSettingChange('maxBitrate', parseInt(e.target.value))}
              min={1000}
            />
          </div>
        </div>

        <div className="encoder-setting-group">
          <h4>{t('hardware.encoder.advanced', 'Advanced Settings')}</h4>

          <div className="hardware-form-group">
            <label>{t('hardware.encoder.keyframeInterval', 'Keyframe Interval (s)')}</label>
            <input
              type="number"
              value={encoderSettings.keyframeInterval}
              onChange={(e) => handleSettingChange('keyframeInterval', parseInt(e.target.value))}
              min={1}
              max={10}
            />
          </div>

          <div className="hardware-form-group">
            <label>{t('hardware.encoder.bframes', 'B-Frames')}</label>
            <input
              type="number"
              value={encoderSettings.bFrames || 2}
              onChange={(e) => handleSettingChange('bFrames', parseInt(e.target.value))}
              min={0}
              max={4}
            />
          </div>

          <div className="hardware-form-group">
            <label>{t('hardware.encoder.multiPass', 'Multi-Pass')}</label>
            <select
              value={encoderSettings.multiPass || MultiPassMode.QUARTER}
              onChange={(e) => handleSettingChange('multiPass', e.target.value as MultiPassMode)}
            >
              <option value={MultiPassMode.DISABLED}>Disabled</option>
              <option value={MultiPassMode.QUARTER}>Quarter Resolution</option>
              <option value={MultiPassMode.FULL}>Full Resolution</option>
            </select>
          </div>
        </div>
      </div>

      <div className="quality-meter">
        <div className="quality-meter-header">
          <h4>{t('hardware.encoder.qualityEstimate', 'Estimated Quality')}</h4>
          <div className="quality-meter-value">
            {Math.round(50 + (Object.values(EncoderPreset).indexOf(encoderSettings.preset) + 1) * 7)}
          </div>
        </div>
        <div className="quality-meter-bar">
          <div
            className="quality-meter-fill"
            style={{
              width: `${50 + (Object.values(EncoderPreset).indexOf(encoderSettings.preset) + 1) * 7}%`
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderDecoderTab = () => (
    <div className="hardware-tab-content">
      <h3>{t('hardware.decoder.title', 'Decoder Settings')}</h3>

      <div className="hardware-form-group">
        <label>{t('hardware.decoder.decoder', 'Hardware Decoder')}</label>
        <select
          value={config.decoderSettings.decoder}
          onChange={(e) => handleDecoderChange(e.target.value as HardwareDecoder)}
        >
          <option value={HardwareDecoder.NVIDIA}>NVIDIA (NVDEC)</option>
          <option value={HardwareDecoder.AMD}>AMD</option>
          <option value={HardwareDecoder.INTEL}>Intel QuickSync</option>
          <option value={HardwareDecoder.APPLE}>Apple VideoToolbox</option>
          <option value={HardwareDecoder.SOFTWARE}>Software (CPU)</option>
        </select>
      </div>

      <div className="hardware-form-row">
        <div className="hardware-form-group">
          <label>{t('hardware.decoder.maxInstances', 'Max Decoder Instances')}</label>
          <input
            type="number"
            value={config.decoderSettings.maxInstances || 4}
            onChange={(e) => updateDecoderSettings({ maxInstances: parseInt(e.target.value) })}
            min={1}
            max={8}
          />
        </div>

        <div className="hardware-form-group">
          <label>{t('hardware.decoder.lowLatency', 'Low Latency Mode')}</label>
          <select
            value={config.decoderSettings.lowLatency ? 'true' : 'false'}
            onChange={(e) => updateDecoderSettings({ lowLatency: e.target.value === 'true' })}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      <div className="hardware-message warning">
        {t('hardware.decoder.note', 'Hardware decoding can reduce CPU usage during playback and streaming.')}
      </div>
    </div>
  );

  const renderBenchmarkTab = () => (
    <div className="hardware-tab-content">
      <h3>{t('hardware.benchmark.title', 'GPU Benchmark')}</h3>

      {!status.activeGPU ? (
        <p className="hardware-empty-message">
          {t('hardware.benchmark.selectGPU', 'Please select a GPU from the GPU Devices tab first.')}
        </p>
      ) : (
        <>
          <div className="benchmark-section">
            <h4>{t('hardware.benchmark.currentGPU', 'Active GPU')}: {status.activeGPU.name}</h4>

            <div className="benchmark-options">
              <div className="hardware-form-group">
                <label>{t('hardware.benchmark.resolution', 'Resolution')}</label>
                <select
                  value={benchmarkConfig.resolution}
                  onChange={(e) => setBenchmarkConfig(c => ({ ...c, resolution: e.target.value }))}
                >
                  <option value="1280x720">720p</option>
                  <option value="1920x1080">1080p</option>
                  <option value="2560x1440">1440p</option>
                  <option value="3840x2160">4K</option>
                </select>
              </div>

              <div className="hardware-form-group">
                <label>{t('hardware.benchmark.frameRate', 'Frame Rate')}</label>
                <select
                  value={benchmarkConfig.frameRate}
                  onChange={(e) => setBenchmarkConfig(c => ({ ...c, frameRate: parseInt(e.target.value) }))}
                >
                  <option value={30}>30 fps</option>
                  <option value={60}>60 fps</option>
                  <option value={120}>120 fps</option>
                </select>
              </div>

              <div className="hardware-form-group">
                <label>{t('hardware.benchmark.duration', 'Duration (s)')}</label>
                <select
                  value={benchmarkConfig.duration}
                  onChange={(e) => setBenchmarkConfig(c => ({ ...c, duration: parseInt(e.target.value) }))}
                >
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>
            </div>

            <button
              className="hardware-button primary"
              onClick={handleBenchmark}
              disabled={benchmarkRunning}
            >
              {benchmarkRunning
                ? t('hardware.benchmark.running', 'Running Benchmark...')
                : t('hardware.benchmark.start', 'Start Benchmark')
              }
            </button>

            {benchmarkRunning && (
              <div className="benchmark-progress">
                <div className="benchmark-progress-bar">
                  <div
                    className="benchmark-progress-fill"
                    style={{ width: `${benchmarkProgress}%` }}
                  />
                  <span className="benchmark-progress-text">{benchmarkProgress}%</span>
                </div>
              </div>
            )}
          </div>

          {benchmarkResult && (
            <div className="benchmark-results">
              <div className="benchmark-result-card">
                <div className="benchmark-result-value">
                  {benchmarkResult.averageFPS.toFixed(1)}
                </div>
                <div className="benchmark-result-label">
                  {t('hardware.benchmark.avgFPS', 'Avg FPS')}
                </div>
              </div>

              <div className="benchmark-result-card">
                <div className="benchmark-result-value">
                  {benchmarkResult.averageLatency.toFixed(1)} ms
                </div>
                <div className="benchmark-result-label">
                  {t('hardware.benchmark.latency', 'Latency')}
                </div>
              </div>

              <div className="benchmark-result-card">
                <div className="benchmark-result-value">
                  {benchmarkResult.gpuUsage.toFixed(0)}%
                </div>
                <div className="benchmark-result-label">
                  {t('hardware.benchmark.gpuUsage', 'GPU Usage')}
                </div>
              </div>

              <div className="benchmark-result-card">
                <div className="benchmark-result-value">
                  {benchmarkResult.powerConsumption.toFixed(0)} W
                </div>
                <div className="benchmark-result-label">
                  {t('hardware.benchmark.power', 'Power')}
                </div>
              </div>

              {benchmarkResult.qualityScore && (
                <div className="benchmark-result-card">
                  <div className="benchmark-result-value">
                    {benchmarkResult.qualityScore.toFixed(0)}
                  </div>
                  <div className="benchmark-result-label">
                    {t('hardware.benchmark.quality', 'Quality Score')}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (!isInitialized) {
    return (
      <div className="hardware-acceleration-panel">
        <div className="hardware-message">
          {t('hardware.initializing', 'Initializing hardware acceleration...')}
        </div>
      </div>
    );
  }

  return (
    <div className="hardware-acceleration-panel">
      <div className="hardware-header">
        <h2>{t('hardware.title', 'Hardware Acceleration')}</h2>
        <p className="hardware-description">
          {t('hardware.description', 'Configure GPU encoding/decoding for optimal streaming performance.')}
        </p>
      </div>

      {(error || success) && (
        <div className={`hardware-message ${error ? 'error' : 'success'}`}>
          {error || success}
        </div>
      )}

      <div className="hardware-tabs">
        <button
          className={`hardware-tab ${activeTab === 'gpus' ? 'active' : ''}`}
          onClick={() => setActiveTab('gpus')}
        >
          {t('hardware.tabs.gpus', 'GPU Devices')}
        </button>
        <button
          className={`hardware-tab ${activeTab === 'encoder' ? 'active' : ''}`}
          onClick={() => setActiveTab('encoder')}
        >
          {t('hardware.tabs.encoder', 'Encoder')}
        </button>
        <button
          className={`hardware-tab ${activeTab === 'decoder' ? 'active' : ''}`}
          onClick={() => setActiveTab('decoder')}
        >
          {t('hardware.tabs.decoder', 'Decoder')}
        </button>
        <button
          className={`hardware-tab ${activeTab === 'benchmark' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmark')}
        >
          {t('hardware.tabs.benchmark', 'Benchmark')}
        </button>
      </div>

      <div className="hardware-content">
        {activeTab === 'gpus' && renderGPUTab()}
        {activeTab === 'encoder' && renderEncoderTab()}
        {activeTab === 'decoder' && renderDecoderTab()}
        {activeTab === 'benchmark' && renderBenchmarkTab()}
      </div>
    </div>
  );
};

export default HardwareAccelerationPanel;
