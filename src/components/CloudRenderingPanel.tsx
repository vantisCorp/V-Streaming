/**
 * Cloud Rendering Panel Component
 * UI for managing cloud-based rendering operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CloudProvider,
  RenderJobStatus,
  RenderQuality,
  RenderCodec,
  CloudInstanceType,
  CloudRenderingConfig,
  RenderJobConfig,
  RenderJob,
  CloudInstance,
  DEFAULT_RENDER_JOB_CONFIG
} from '../types/cloudRendering';
import { useCloudRendering } from '../hooks/useCloudRendering';
import './CloudRenderingPanel.css';

type TabType = 'connection' | 'jobs' | 'instances' | 'pricing';

const CloudRenderingPanel: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('connection');
  
  const {
    isConfigured,
    isConnected,
    isRendering,
    config,
    jobs,
    instances,
    stats,
    pricing,
    configure,
    connect,
    disconnect,
    startInstance,
    stopInstance,
    createJob,
    cancelJob,
    refreshStats,
    refreshPricing
  } = useCloudRendering();

  // Local state for forms
  const [provider, setProvider] = useState<CloudProvider>(CloudProvider.AWS);
  const [region, setRegion] = useState('us-east-1');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [instanceType, setInstanceType] = useState<CloudInstanceType>(CloudInstanceType.GPU_SMALL);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Job form state
  const [jobName, setJobName] = useState('My Render Job');
  const [sourceUrl, setSourceUrl] = useState('');
  const [resolution, setResolution] = useState('1920x1080');
  const [frameRate, setFrameRate] = useState(30);
  const [bitrate, setBitrate] = useState(8000);
  const [quality, setQuality] = useState<RenderQuality>(RenderQuality.HIGH);
  const [codec, setCodec] = useState<RenderCodec>(RenderCodec.H264);

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

  // Refresh pricing when provider changes
  useEffect(() => {
    if (isConnected) {
      refreshPricing();
    }
  }, [isConnected, refreshPricing]);

  const handleConfigure = useCallback(async () => {
    try {
      setError(null);
      const newConfig: CloudRenderingConfig = {
        enabled: true,
        provider,
        credentials: {
          accessKeyId: apiKey,
          secretAccessKey: apiSecret,
          region
        },
        region,
        instanceType,
        autoScale: false,
        minInstances: 1,
        maxInstances: 5,
        idleTimeout: 30,
        costLimit: 100,
        preferredCodec: codec,
        defaultQuality: quality,
        defaultInstanceType: instanceType,
        apiKey,
        apiSecret
      };
      await configure(newConfig);
      setSuccess('Cloud rendering configured successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration failed');
    }
  }, [provider, region, apiKey, apiSecret, instanceType, codec, quality, configure]);

  const handleConnect = useCallback(async () => {
    try {
      setError(null);
      await connect();
      setSuccess('Connected to cloud service');
      refreshStats();
      refreshPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [connect, refreshStats, refreshPricing]);

  const handleDisconnect = useCallback(async () => {
    try {
      setError(null);
      await disconnect();
      setSuccess('Disconnected from cloud service');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnection failed');
    }
  }, [disconnect]);

  const handleStartInstance = useCallback(async () => {
    try {
      setError(null);
      const instance = await startInstance(instanceType);
      setSuccess(`Instance ${instance.id} started`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start instance');
    }
  }, [startInstance, instanceType]);

  const handleStopInstance = useCallback(async (instanceId: string) => {
    try {
      setError(null);
      await stopInstance(instanceId);
      setSuccess(`Instance ${instanceId} stopped`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop instance');
    }
  }, [stopInstance]);

  const handleCreateJob = useCallback(async () => {
    try {
      setError(null);
      const jobConfig: RenderJobConfig = {
        name: jobName,
        sourceUrl,
        outputFormat: 'mp4',
        codec,
        quality,
        resolution,
        frameRate,
        bitrate,
        keyframeInterval: 2,
        audioCodec: 'aac',
        audioBitrate: 192
      };
      const job = await createJob(jobConfig);
      setSuccess(`Job ${job.id} created`);
      setSourceUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    }
  }, [jobName, sourceUrl, codec, quality, resolution, frameRate, bitrate, createJob]);

  const handleCancelJob = useCallback(async (jobId: string) => {
    try {
      setError(null);
      await cancelJob(jobId);
      setSuccess(`Job ${jobId} cancelled`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
    }
  }, [cancelJob]);

  const renderConnectionTab = () => (
    <div className="cloud-tab-content">
      <h3>{t('cloud.connection.title', 'Cloud Connection')}</h3>
      
      <div className="cloud-form-group">
        <label>{t('cloud.connection.provider', 'Provider')}</label>
        <select value={provider} onChange={(e) => setProvider(e.target.value as CloudProvider)}>
          <option value={CloudProvider.AWS}>Amazon Web Services</option>
          <option value={CloudProvider.GOOGLE_CLOUD}>Google Cloud Platform</option>
          <option value={CloudProvider.AZURE}>Microsoft Azure</option>
        </select>
      </div>

      <div className="cloud-form-group">
        <label>{t('cloud.connection.region', 'Region')}</label>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="us-east-1">US East (N. Virginia)</option>
          <option value="us-west-2">US West (Oregon)</option>
          <option value="eu-west-1">EU (Ireland)</option>
          <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
        </select>
      </div>

      <div className="cloud-form-group">
        <label>{t('cloud.connection.apiKey', 'API Key')}</label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
        />
      </div>

      <div className="cloud-form-group">
        <label>{t('cloud.connection.apiSecret', 'API Secret')}</label>
        <input
          type="password"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          placeholder="Enter your API secret"
        />
      </div>

      <div className="cloud-form-group">
        <label>{t('cloud.connection.instanceType', 'Instance Type')}</label>
        <select value={instanceType} onChange={(e) => setInstanceType(e.target.value as CloudInstanceType)}>
          <option value={CloudInstanceType.CPU_SMALL}>CPU Small</option>
          <option value={CloudInstanceType.CPU_MEDIUM}>CPU Medium</option>
          <option value={CloudInstanceType.CPU_LARGE}>CPU Large</option>
          <option value={CloudInstanceType.GPU_SMALL}>GPU Small</option>
          <option value={CloudInstanceType.GPU_MEDIUM}>GPU Medium</option>
          <option value={CloudInstanceType.GPU_LARGE}>GPU Large</option>
        </select>
      </div>

      <div className="cloud-button-group">
        <button 
          className="cloud-button primary"
          onClick={handleConfigure}
          disabled={isConnected}
        >
          {t('cloud.connection.configure', 'Configure')}
        </button>
        
        {!isConnected ? (
          <button 
            className="cloud-button success"
            onClick={handleConnect}
            disabled={!isConfigured}
          >
            {t('cloud.connection.connect', 'Connect')}
          </button>
        ) : (
          <button 
            className="cloud-button danger"
            onClick={handleDisconnect}
          >
            {t('cloud.connection.disconnect', 'Disconnect')}
          </button>
        )}
      </div>

      <div className="cloud-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
        <span>{isConnected ? t('cloud.status.connected', 'Connected') : t('cloud.status.disconnected', 'Disconnected')}</span>
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="cloud-tab-content">
      <h3>{t('cloud.jobs.title', 'Render Jobs')}</h3>

      <div className="cloud-job-form">
        <h4>{t('cloud.jobs.newJob', 'New Render Job')}</h4>
        
        <div className="cloud-form-row">
          <div className="cloud-form-group">
            <label>{t('cloud.jobs.name', 'Job Name')}</label>
            <input
              type="text"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="My Render Job"
            />
          </div>
          
          <div className="cloud-form-group">
            <label>{t('cloud.jobs.sourceUrl', 'Source URL')}</label>
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="cloud-form-row">
          <div className="cloud-form-group">
            <label>{t('cloud.jobs.resolution', 'Resolution')}</label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <option value="1280x720">720p (1280x720)</option>
              <option value="1920x1080">1080p (1920x1080)</option>
              <option value="2560x1440">1440p (2560x1440)</option>
              <option value="3840x2160">4K (3840x2160)</option>
            </select>
          </div>

          <div className="cloud-form-group">
            <label>{t('cloud.jobs.frameRate', 'Frame Rate')}</label>
            <select value={frameRate} onChange={(e) => setFrameRate(Number(e.target.value))}>
              <option value={24}>24 fps</option>
              <option value={30}>30 fps</option>
              <option value={60}>60 fps</option>
            </select>
          </div>

          <div className="cloud-form-group">
            <label>{t('cloud.jobs.bitrate', 'Bitrate (kbps)')}</label>
            <input
              type="number"
              value={bitrate}
              onChange={(e) => setBitrate(Number(e.target.value))}
              min={1000}
              max={50000}
            />
          </div>
        </div>

        <div className="cloud-form-row">
          <div className="cloud-form-group">
            <label>{t('cloud.jobs.quality', 'Quality')}</label>
            <select value={quality} onChange={(e) => setQuality(e.target.value as RenderQuality)}>
              <option value={RenderQuality.LOW}>Low</option>
              <option value={RenderQuality.MEDIUM}>Medium</option>
              <option value={RenderQuality.HIGH}>High</option>
              <option value={RenderQuality.ULTRA}>Ultra</option>
            </select>
          </div>

          <div className="cloud-form-group">
            <label>{t('cloud.jobs.codec', 'Codec')}</label>
            <select value={codec} onChange={(e) => setCodec(e.target.value as RenderCodec)}>
              <option value={RenderCodec.H264}>H.264</option>
              <option value={RenderCodec.H265}>H.265 (HEVC)</option>
              <option value={RenderCodec.VP9}>VP9</option>
              <option value={RenderCodec.AV1}>AV1</option>
            </select>
          </div>
        </div>

        <button 
          className="cloud-button primary"
          onClick={handleCreateJob}
          disabled={!isConnected || isRendering || !sourceUrl}
        >
          {t('cloud.jobs.create', 'Create Job')}
        </button>
      </div>

      <div className="cloud-jobs-list">
        <h4>{t('cloud.jobs.activeJobs', 'Active Jobs')}</h4>
        {jobs.length === 0 ? (
          <p className="cloud-empty-message">{t('cloud.jobs.noJobs', 'No active jobs')}</p>
        ) : (
          <div className="cloud-table-container">
            <table className="cloud-table">
              <thead>
                <tr>
                  <th>{t('cloud.jobs.table.name', 'Name')}</th>
                  <th>{t('cloud.jobs.table.status', 'Status')}</th>
                  <th>{t('cloud.jobs.table.progress', 'Progress')}</th>
                  <th>{t('cloud.jobs.table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.config.name}</td>
                    <td>
                      <span className={`status-badge ${job.status.toLowerCase()}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${job.progress}%` }}></div>
                        <span className="progress-text">{Math.round(job.progress)}%</span>
                      </div>
                    </td>
                    <td>
                      {job.status === RenderJobStatus.PROCESSING && (
                        <button 
                          className="cloud-button small danger"
                          onClick={() => handleCancelJob(job.id)}
                        >
                          {t('cloud.jobs.cancel', 'Cancel')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderInstancesTab = () => (
    <div className="cloud-tab-content">
      <h3>{t('cloud.instances.title', 'Cloud Instances')}</h3>

      <div className="cloud-instances-controls">
        <div className="cloud-form-group">
          <label>{t('cloud.instances.type', 'Instance Type')}</label>
          <select value={instanceType} onChange={(e) => setInstanceType(e.target.value as CloudInstanceType)}>
            <option value={CloudInstanceType.CPU_SMALL}>CPU Small ($0.10/hr)</option>
            <option value={CloudInstanceType.CPU_MEDIUM}>CPU Medium ($0.25/hr)</option>
            <option value={CloudInstanceType.CPU_LARGE}>CPU Large ($0.50/hr)</option>
            <option value={CloudInstanceType.GPU_SMALL}>GPU Small ($0.90/hr)</option>
            <option value={CloudInstanceType.GPU_MEDIUM}>GPU Medium ($1.85/hr)</option>
            <option value={CloudInstanceType.GPU_LARGE}>GPU Large ($3.70/hr)</option>
          </select>
        </div>

        <button 
          className="cloud-button primary"
          onClick={handleStartInstance}
          disabled={!isConnected}
        >
          {t('cloud.instances.start', 'Start Instance')}
        </button>
      </div>

      <div className="cloud-instances-list">
        <h4>{t('cloud.instances.activeInstances', 'Active Instances')}</h4>
        {instances.length === 0 ? (
          <p className="cloud-empty-message">{t('cloud.instances.noInstances', 'No active instances')}</p>
        ) : (
          <div className="cloud-table-container">
            <table className="cloud-table">
              <thead>
                <tr>
                  <th>{t('cloud.instances.table.id', 'ID')}</th>
                  <th>{t('cloud.instances.table.type', 'Type')}</th>
                  <th>{t('cloud.instances.table.status', 'Status')}</th>
                  <th>{t('cloud.instances.table.region', 'Region')}</th>
                  <th>{t('cloud.instances.table.hourlyRate', 'Hourly Rate')}</th>
                  <th>{t('cloud.instances.table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {instances.map((instance) => (
                  <tr key={instance.id}>
                    <td>{instance.id.substring(0, 12)}...</td>
                    <td>{instance.type}</td>
                    <td>
                      <span className={`status-badge ${instance.status}`}>
                        {instance.status}
                      </span>
                    </td>
                    <td>{instance.region}</td>
                    <td>${instance.hourlyRate.toFixed(2)}</td>
                    <td>
                      {instance.status === 'running' && (
                        <button 
                          className="cloud-button small danger"
                          onClick={() => handleStopInstance(instance.id)}
                        >
                          {t('cloud.instances.stop', 'Stop')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderPricingTab = () => (
    <div className="cloud-tab-content">
      <h3>{t('cloud.pricing.title', 'Pricing')}</h3>

      <div className="cloud-stats-grid">
        <div className="cloud-stat-card">
          <h4>{t('cloud.pricing.totalJobs', 'Total Jobs')}</h4>
          <div className="stat-value">{stats.totalJobs}</div>
        </div>
        <div className="cloud-stat-card">
          <h4>{t('cloud.pricing.completedJobs', 'Completed')}</h4>
          <div className="stat-value">{stats.completedJobs}</div>
        </div>
        <div className="cloud-stat-card">
          <h4>{t('cloud.pricing.failedJobs', 'Failed')}</h4>
          <div className="stat-value">{stats.failedJobs}</div>
        </div>
        <div className="cloud-stat-card">
          <h4>{t('cloud.pricing.totalCost', 'Total Cost')}</h4>
          <div className="stat-value">${stats.totalCost.toFixed(2)}</div>
        </div>
      </div>

      <div className="cloud-pricing-list">
        <h4>{t('cloud.pricing.instancePricing', 'Instance Pricing')}</h4>
        {pricing.length === 0 ? (
          <p className="cloud-empty-message">{t('cloud.pricing.noPricing', 'No pricing data available')}</p>
        ) : (
          <div className="cloud-table-container">
            <table className="cloud-table">
              <thead>
                <tr>
                  <th>{t('cloud.pricing.table.instance', 'Instance')}</th>
                  <th>{t('cloud.pricing.table.description', 'Description')}</th>
                  <th>{t('cloud.pricing.table.hourlyRate', 'Hourly Rate')}</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((item, index) => (
                  <tr key={index}>
                    <td>{item.instanceType}</td>
                    <td>{item.description}</td>
                    <td>${item.hourlyRate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button 
        className="cloud-button primary"
        onClick={refreshPricing}
        disabled={!isConnected}
      >
        {t('cloud.pricing.refresh', 'Refresh Pricing')}
      </button>
    </div>
  );

  return (
    <div className="cloud-rendering-panel">
      <div className="cloud-header">
        <h2>{t('cloud.title', 'Cloud Rendering')}</h2>
        <p className="cloud-description">
          {t('cloud.description', 'Configure and manage cloud-based rendering for your streams and recordings.')}
        </p>
      </div>

      {(error || success) && (
        <div className={`cloud-message ${error ? 'error' : 'success'}`}>
          {error || success}
        </div>
      )}

      <div className="cloud-tabs">
        <button 
          className={`cloud-tab ${activeTab === 'connection' ? 'active' : ''}`}
          onClick={() => setActiveTab('connection')}
        >
          {t('cloud.tabs.connection', 'Connection')}
        </button>
        <button 
          className={`cloud-tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
          disabled={!isConnected}
        >
          {t('cloud.tabs.jobs', 'Jobs')}
        </button>
        <button 
          className={`cloud-tab ${activeTab === 'instances' ? 'active' : ''}`}
          onClick={() => setActiveTab('instances')}
          disabled={!isConnected}
        >
          {t('cloud.tabs.instances', 'Instances')}
        </button>
        <button 
          className={`cloud-tab ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
          disabled={!isConnected}
        >
          {t('cloud.tabs.pricing', 'Pricing')}
        </button>
      </div>

      <div className="cloud-content">
        {activeTab === 'connection' && renderConnectionTab()}
        {activeTab === 'jobs' && renderJobsTab()}
        {activeTab === 'instances' && renderInstancesTab()}
        {activeTab === 'pricing' && renderPricingTab()}
      </div>
    </div>
  );
};

export default CloudRenderingPanel;
