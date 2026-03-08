/**
 * Marketplace - VTuber marketplace and sharing platform
 * Browse, download, and share VTuber content
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  MarketplaceItem,
  MarketplaceItemType,
  MarketplaceCategory,
  MarketplaceSortBy,
  MarketplaceUpload,
  ModelType,
} from '../types/vtuber';
import { useMarketplace } from '../hooks/useMarketplace';
import './Marketplace.css';

// Type labels
const TYPE_LABELS: Record<MarketplaceItemType, string> = {
  [MarketplaceItemType.EXPRESSION]: '😊 Expression',
  [MarketplaceItemType.AVATAR]: '👤 Avatar',
  [MarketplaceItemType.ANIMATION]: '🎬 Animation',
  [MarketplaceItemType.BACKGROUND]: '🖼️ Background',
  [MarketplaceItemType.PROP]: '🎭 Prop',
  [MarketplaceItemType.PLUGIN]: '🔌 Plugin',
};

const CATEGORY_LABELS: Record<MarketplaceCategory, string> = {
  [MarketplaceCategory.FREE]: '🆓 Free',
  [MarketplaceCategory.PAID]: '💰 Paid',
  [MarketplaceCategory.PREMIUM]: '⭐ Premium',
  [MarketplaceCategory.COMMUNITY]: '👥 Community',
  [MarketplaceCategory.OFFICIAL]: '✅ Official',
};

const SORT_LABELS: Record<MarketplaceSortBy, string> = {
  [MarketplaceSortBy.RELEVANCE]: 'Relevance',
  [MarketplaceSortBy.NEWEST]: 'Newest',
  [MarketplaceSortBy.POPULAR]: 'Popular',
  [MarketplaceSortBy.DOWNLOADS]: 'Most Downloads',
  [MarketplaceSortBy.RATING]: 'Top Rated',
  [MarketplaceSortBy.PRICE_LOW]: 'Price: Low to High',
  [MarketplaceSortBy.PRICE_HIGH]: 'Price: High to Low',
};

interface MarketplaceProps {
  className?: string;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  className = '',
}) => {
  const marketplace = useMarketplace();
  
  // Local state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<MarketplaceItemType | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<MarketplaceCategory | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState<Partial<MarketplaceUpload>>({
    name: '',
    description: '',
    type: MarketplaceItemType.EXPRESSION,
    category: MarketplaceCategory.FREE,
    price: 0,
    tags: [],
    compatibleModels: [],
  });

  // Filter items
  const filteredItems = useMemo(() => {
    let items = [...marketplace.items];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [marketplace.items, searchQuery]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    marketplace.searchItems({ query });
  }, [marketplace]);

  // Handle type filter
  const handleTypeFilter = useCallback((type: MarketplaceItemType | null) => {
    setActiveTypeFilter(type);
    marketplace.filterByType(type);
  }, [marketplace]);

  // Handle category filter
  const handleCategoryFilter = useCallback((category: MarketplaceCategory | null) => {
    setActiveCategoryFilter(category);
    marketplace.filterByCategory(category);
  }, [marketplace]);

  // Handle item click
  const handleItemClick = useCallback((item: MarketplaceItem) => {
    marketplace.selectItem(item);
    setShowItemModal(true);
  }, [marketplace]);

  // Handle download
  const handleDownload = useCallback(async (item: MarketplaceItem) => {
    await marketplace.downloadItem(item.id);
  }, [marketplace]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback((item: MarketplaceItem) => {
    marketplace.toggleFavorite(item.id);
  }, [marketplace]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!uploadForm.name || !uploadForm.description) return;

    const item = await marketplace.uploadItem(uploadForm as MarketplaceUpload);
    if (item) {
      setShowUploadModal(false);
      setUploadForm({
        name: '',
        description: '',
        type: MarketplaceItemType.EXPRESSION,
        category: MarketplaceCategory.FREE,
        price: 0,
        tags: [],
        compatibleModels: [],
      });
    }
  }, [marketplace, uploadForm]);

  // Format number
  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }, []);

  // Format price
  const formatPrice = useCallback((price: number): string => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  }, []);

  // Format date
  const formatDate = useCallback((timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  }, []);

  return (
    <div className={`marketplace ${className}`}>
      {/* Header */}
      <div className="marketplace-header">
        <h2>🛒 VTuber Marketplace</h2>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowUploadModal(true)}
          >
            + Upload Content
          </button>
        </div>
      </div>

      {/* Featured Section */}
      {marketplace.featured.length > 0 && (
        <div className="featured-section">
          <h3>✨ Featured</h3>
          <div className="featured-grid">
            {marketplace.featured.slice(0, 4).map(item => (
              <div
                key={item.id}
                className="featured-card"
                onClick={() => handleItemClick(item)}
              >
                <div className="featured-thumbnail">
                  <span className="type-icon">
                    {item.type === MarketplaceItemType.EXPRESSION ? '😊' :
                     item.type === MarketplaceItemType.AVATAR ? '👤' :
                     item.type === MarketplaceItemType.ANIMATION ? '🎬' : '📦'}
                  </span>
                </div>
                <div className="featured-info">
                  <h4>{item.name}</h4>
                  <p>{item.author.displayName}</p>
                  <div className="featured-stats">
                    <span>⭐ {item.rating.average.toFixed(1)}</span>
                    <span>📥 {formatNumber(item.downloads)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search expressions, avatars, animations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Type:</label>
            <div className="filter-chips">
              <button
                className={`chip ${activeTypeFilter === null ? 'active' : ''}`}
                onClick={() => handleTypeFilter(null)}
              >
                All
              </button>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  className={`chip ${activeTypeFilter === value ? 'active' : ''}`}
                  onClick={() => handleTypeFilter(value as MarketplaceItemType)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Category:</label>
            <div className="filter-chips">
              <button
                className={`chip ${activeCategoryFilter === null ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(null)}
              >
                All
              </button>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  className={`chip ${activeCategoryFilter === value ? 'active' : ''}`}
                  onClick={() => handleCategoryFilter(value as MarketplaceCategory)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Sort:</label>
            <select
              value={marketplace.filters.sortBy}
              onChange={(e) => marketplace.setFilters({ sortBy: e.target.value as MarketplaceSortBy })}
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="items-section">
        {marketplace.isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>No items found</p>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="item-card">
                <div className="item-thumbnail" onClick={() => handleItemClick(item)}>
                  <span className="type-icon large">
                    {item.type === MarketplaceItemType.EXPRESSION ? '😊' :
                     item.type === MarketplaceItemType.AVATAR ? '👤' :
                     item.type === MarketplaceItemType.ANIMATION ? '🎬' : '📦'}
                  </span>
                  {item.isFeatured && <span className="featured-badge">Featured</span>}
                </div>
                <div className="item-content">
                  <h4 onClick={() => handleItemClick(item)}>{item.name}</h4>
                  <p className="item-author">by {item.author.displayName}</p>
                  <p className="item-description">{item.description.slice(0, 60)}...</p>
                  <div className="item-meta">
                    <span className="rating">⭐ {item.rating.average.toFixed(1)}</span>
                    <span className="downloads">📥 {formatNumber(item.downloads)}</span>
                  </div>
                  <div className="item-footer">
                    <span className={`price ${item.price === 0 ? 'free' : ''}`}>
                      {formatPrice(item.price)}
                    </span>
                    <div className="item-actions">
                      <button
                        className={`btn btn-icon ${marketplace.isFavorite(item.id) ? 'active' : ''}`}
                        onClick={() => handleFavoriteToggle(item)}
                        title="Toggle Favorite"
                      >
                        {marketplace.isFavorite(item.id) ? '❤️' : '🤍'}
                      </button>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleDownload(item)}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredItems.length > marketplace.currentPage * 20 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            onClick={() => marketplace.setPage(marketplace.currentPage - 1)}
            disabled={marketplace.currentPage === 1}
          >
            Previous
          </button>
          <span>Page {marketplace.currentPage}</span>
          <button
            className="btn btn-secondary"
            onClick={() => marketplace.setPage(marketplace.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal upload-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📤 Upload Content</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder="Enter content name..."
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Describe your content..."
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as MarketplaceItemType })}
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as MarketplaceCategory })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                value={uploadForm.price}
                onChange={(e) => setUploadForm({ ...uploadForm, price: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.99"
              />
              <small>Set to 0 for free content</small>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!uploadForm.name || !uploadForm.description}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {showItemModal && marketplace.selectedItem && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal item-modal" onClick={(e) => e.stopPropagation()}>
            <div className="item-modal-header">
              <span className="type-icon large">
                {marketplace.selectedItem.type === MarketplaceItemType.EXPRESSION ? '😊' :
                 marketplace.selectedItem.type === MarketplaceItemType.AVATAR ? '👤' :
                 marketplace.selectedItem.type === MarketplaceItemType.ANIMATION ? '🎬' : '📦'}
              </span>
              <div className="item-modal-title">
                <h3>{marketplace.selectedItem.name}</h3>
                <p>by {marketplace.selectedItem.author.displayName}</p>
              </div>
              <button className="btn btn-icon close-btn" onClick={() => setShowItemModal(false)}>
                ✕
              </button>
            </div>
            <div className="item-modal-content">
              <p className="description">{marketplace.selectedItem.description}</p>
              
              <div className="item-details-grid">
                <div className="detail">
                  <label>Category</label>
                  <span>{CATEGORY_LABELS[marketplace.selectedItem.category]}</span>
                </div>
                <div className="detail">
                  <label>Version</label>
                  <span>{marketplace.selectedItem.version}</span>
                </div>
                <div className="detail">
                  <label>Downloads</label>
                  <span>{formatNumber(marketplace.selectedItem.downloads)}</span>
                </div>
                <div className="detail">
                  <label>Rating</label>
                  <span>⭐ {marketplace.selectedItem.rating.average.toFixed(1)} ({marketplace.selectedItem.rating.count})</span>
                </div>
                <div className="detail">
                  <label>Updated</label>
                  <span>{formatDate(marketplace.selectedItem.updatedAt)}</span>
                </div>
                <div className="detail">
                  <label>Size</label>
                  <span>{(marketplace.selectedItem.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>

              <div className="item-tags">
                {marketplace.selectedItem.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>

              <div className="item-modal-actions">
                <span className={`price large ${marketplace.selectedItem.price === 0 ? 'free' : ''}`}>
                  {formatPrice(marketplace.selectedItem.price)}
                </span>
                <button
                  className={`btn btn-icon ${marketplace.isFavorite(marketplace.selectedItem.id) ? 'active' : ''}`}
                  onClick={() => handleFavoriteToggle(marketplace.selectedItem!)}
                >
                  {marketplace.isFavorite(marketplace.selectedItem.id) ? '❤️' : '🤍'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(marketplace.selectedItem!)}
                >
                  📥 Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;