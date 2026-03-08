/**
 * MarketplaceService - Service for VTuber marketplace and sharing platform
 * Supports expressions, avatars, animations, and more
 */

import { EventEmitter } from 'eventemitter3';
import {
  MarketplaceItem,
  MarketplaceItemType,
  MarketplaceItemStatus,
  MarketplaceCategory,
  MarketplaceAuthor,
  MarketplaceRating,
  MarketplaceReview,
  MarketplaceFilters,
  MarketplaceUpload,
  MarketplaceState,
  MarketplaceCollection,
  MarketplaceSortBy,
  DEFAULT_MARKETPLACE_FILTERS,
  DEFAULT_MARKETPLACE_STATE,
  ModelType,
} from '../types/vtuber';

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ============ Events ============

export interface MarketplaceEvents {
  'items:loaded': (items: MarketplaceItem[]) => void;
  'item:selected': (item: MarketplaceItem | null) => void;
  'item:downloaded': (item: MarketplaceItem) => void;
  'item:uploaded': (item: MarketplaceItem) => void;
  'item:updated': (item: MarketplaceItem) => void;
  'item:deleted': (itemId: string) => void;
  'favorite:added': (itemId: string) => void;
  'favorite:removed': (itemId: string) => void;
  'review:added': (review: MarketplaceReview) => void;
  'filters:changed': (filters: MarketplaceFilters) => void;
  'state:changed': (state: MarketplaceState) => void;
  'error': (error: string) => void;
}

// ============ Mock Data ============

const MOCK_AUTHOR: MarketplaceAuthor = {
  id: 'author-1',
  username: 'vtuber_creator',
  displayName: 'VTuber Creator',
  avatarUrl: null,
  isVerified: true,
  bio: 'Creating awesome VTuber content',
  followers: 12500,
  totalDownloads: 50000,
};

const createMockItem = (
  id: string,
  name: string,
  type: MarketplaceItemType,
  category: MarketplaceCategory,
  downloads: number,
  rating: number
): MarketplaceItem => ({
  id,
  name,
  description: `A beautiful ${type} for VTuber streaming`,
  type,
  category,
  status: MarketplaceItemStatus.APPROVED,
  author: MOCK_AUTHOR,
  previewImages: [],
  thumbnailUrl: null,
  tags: [type, category],
  version: '1.0.0',
  downloads,
  rating: {
    average: rating,
    count: Math.floor(downloads * 0.1),
    distribution: { 1: 5, 2: 10, 3: 20, 4: 30, 5: 35 },
  },
  price: category === MarketplaceCategory.FREE ? 0 : 4.99,
  currency: 'USD',
  fileSize: Math.floor(Math.random() * 10000000),
  fileUrl: null,
  createdAt: Date.now() - Math.floor(Math.random() * 31536000000),
  updatedAt: Date.now() - Math.floor(Math.random() * 2592000000),
  isFeatured: downloads > 5000,
  compatibleModels: [ModelType.VRM, ModelType.LIVE2D],
  reviews: [],
  changelog: ['Initial release'],
});

// ============ Service ============

export class MarketplaceService extends EventEmitter<MarketplaceEvents> {
  private static instance: MarketplaceService | null = null;
  
  private state: MarketplaceState;
  private allItems: MarketplaceItem[];

  private constructor() {
    super();
    this.state = { ...DEFAULT_MARKETPLACE_STATE };
    this.allItems = this.generateMockItems();
    this.state.featured = this.allItems.filter(item => item.isFeatured).slice(0, 6);
  }

  static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }

  // ============ Mock Data Generation ============

  private generateMockItems(): MarketplaceItem[] {
    const items: MarketplaceItem[] = [];
    
    const expressions = ['Happy Smile', 'Sad Face', 'Angry Look', 'Surprised!', 'Wink', 'Blink', 'Smirk', 'Blush'];
    const avatars = ['Cat Girl', 'Fox Boy', 'Demon Lord', 'Angel', 'Robot Maid', 'School Girl', 'Fantasy Warrior'];
    const animations = ['Wave Hello', 'Dance Loop', 'Idle Sway', 'Victory Pose', 'Sad Walk', 'Excited Jump'];
    
    expressions.forEach((name, i) => {
      items.push(createMockItem(
        `expr-${i}`,
        name,
        MarketplaceItemType.EXPRESSION,
        i % 3 === 0 ? MarketplaceCategory.FREE : MarketplaceCategory.COMMUNITY,
        Math.floor(Math.random() * 10000),
        3.5 + Math.random() * 1.5
      ));
    });

    avatars.forEach((name, i) => {
      items.push(createMockItem(
        `avatar-${i}`,
        name,
        MarketplaceItemType.AVATAR,
        i % 2 === 0 ? MarketplaceCategory.PREMIUM : MarketplaceCategory.PAID,
        Math.floor(Math.random() * 20000),
        4 + Math.random() * 1
      ));
    });

    animations.forEach((name, i) => {
      items.push(createMockItem(
        `anim-${i}`,
        name,
        MarketplaceItemType.ANIMATION,
        i % 2 === 0 ? MarketplaceCategory.FREE : MarketplaceCategory.COMMUNITY,
        Math.floor(Math.random() * 8000),
        3 + Math.random() * 2
      ));
    });

    return items;
  }

  // ============ Item Management ============

  /**
   * Get all items with current filters
   */
  getItems(): MarketplaceItem[] {
    return this.state.items;
  }

  /**
   * Get featured items
   */
  getFeatured(): MarketplaceItem[] {
    return this.state.featured;
  }

  /**
   * Get user's items
   */
  getMyItems(): MarketplaceItem[] {
    return this.state.myItems;
  }

  /**
   * Get item by ID
   */
  getItem(id: string): MarketplaceItem | undefined {
    return this.allItems.find(item => item.id === id);
  }

  /**
   * Search items with filters
   */
  async searchItems(filters: Partial<MarketplaceFilters> = {}): Promise<MarketplaceItem[]> {
    this.state.isLoading = true;
    this.emit('state:changed', this.state);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const newFilters = { ...this.state.filters, ...filters };
    this.state.filters = newFilters;

    let filtered = [...this.allItems];

    // Apply search query
    if (newFilters.query) {
      const query = newFilters.query.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (newFilters.types.length > 0) {
      filtered = filtered.filter(item => newFilters.types.includes(item.type));
    }

    // Apply category filter
    if (newFilters.categories.length > 0) {
      filtered = filtered.filter(item => newFilters.categories.includes(item.category));
    }

    // Apply price filter
    filtered = filtered.filter(item =>
      item.price >= newFilters.priceRange[0] &&
      item.price <= newFilters.priceRange[1]
    );

    // Apply rating filter
    if (newFilters.ratingMin > 0) {
      filtered = filtered.filter(item => item.rating.average >= newFilters.ratingMin);
    }

    // Apply author filter
    if (newFilters.authorId) {
      filtered = filtered.filter(item => item.author.id === newFilters.authorId);
    }

    // Apply compatibility filter
    if (newFilters.compatibleWith) {
      filtered = filtered.filter(item =>
        item.compatibleModels.includes(newFilters.compatibleWith!)
      );
    }

    // Sort items
    filtered = this.sortItems(filtered, newFilters.sortBy, newFilters.sortOrder);

    this.state.items = filtered;
    this.state.totalCount = filtered.length;
    this.state.isLoading = false;
    this.state.error = null;

    this.emit('items:loaded', filtered);
    this.emit('state:changed', this.state);

    return filtered;
  }

  /**
   * Sort items
   */
  private sortItems(items: MarketplaceItem[], sortBy: MarketplaceSortBy, sortOrder: 'asc' | 'desc'): MarketplaceItem[] {
    const sorted = [...items];

    switch (sortBy) {
      case MarketplaceSortBy.NEWEST:
        sorted.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case MarketplaceSortBy.POPULAR:
        sorted.sort((a, b) => b.downloads - a.downloads);
        break;
      case MarketplaceSortBy.DOWNLOADS:
        sorted.sort((a, b) => b.downloads - a.downloads);
        break;
      case MarketplaceSortBy.RATING:
        sorted.sort((a, b) => b.rating.average - a.rating.average);
        break;
      case MarketplaceSortBy.PRICE_LOW:
        sorted.sort((a, b) => a.price - b.price);
        break;
      case MarketplaceSortBy.PRICE_HIGH:
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        // Relevance - no specific sort
        break;
    }

    if (sortOrder === 'asc' && sortBy !== MarketplaceSortBy.POPULAR && sortBy !== MarketplaceSortBy.DOWNLOADS) {
      sorted.reverse();
    }

    return sorted;
  }

  /**
   * Select item
   */
  selectItem(item: MarketplaceItem | null): void {
    this.state.selectedItem = item;
    this.emit('item:selected', item);
    this.emit('state:changed', this.state);
  }

  // ============ Download & Favorites ============

  /**
   * Download item
   */
  async downloadItem(itemId: string): Promise<boolean> {
    const item = this.getItem(itemId);
    if (!item) return false;

    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update download count
    item.downloads++;

    // Add to user's downloads
    if (!this.state.downloads.includes(itemId)) {
      this.state.downloads.push(itemId);
    }

    this.emit('item:downloaded', item);
    this.emit('state:changed', this.state);

    return true;
  }

  /**
   * Add to favorites
   */
  addToFavorites(itemId: string): boolean {
    if (this.state.favorites.includes(itemId)) return false;

    this.state.favorites.push(itemId);
    this.emit('favorite:added', itemId);
    this.emit('state:changed', this.state);

    return true;
  }

  /**
   * Remove from favorites
   */
  removeFromFavorites(itemId: string): boolean {
    const index = this.state.favorites.indexOf(itemId);
    if (index === -1) return false;

    this.state.favorites.splice(index, 1);
    this.emit('favorite:removed', itemId);
    this.emit('state:changed', this.state);

    return true;
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(itemId: string): boolean {
    if (this.state.favorites.includes(itemId)) {
      return this.removeFromFavorites(itemId);
    }
    return this.addToFavorites(itemId);
  }

  /**
   * Check if item is favorite
   */
  isFavorite(itemId: string): boolean {
    return this.state.favorites.includes(itemId);
  }

  // ============ Upload & Management ============

  /**
   * Upload new item
   */
  async uploadItem(upload: MarketplaceUpload): Promise<MarketplaceItem | null> {
    try {
      const item: MarketplaceItem = {
        id: generateUUID(),
        name: upload.name,
        description: upload.description,
        type: upload.type,
        category: upload.category,
        status: MarketplaceItemStatus.PENDING,
        author: {
          id: 'current-user',
          username: 'me',
          displayName: 'Me',
          avatarUrl: null,
          isVerified: false,
          bio: null,
          followers: 0,
          totalDownloads: 0,
        },
        previewImages: [],
        thumbnailUrl: null,
        tags: upload.tags,
        version: '1.0.0',
        downloads: 0,
        rating: {
          average: 0,
          count: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
        price: upload.price,
        currency: 'USD',
        fileSize: upload.file?.size || 0,
        fileUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFeatured: false,
        compatibleModels: upload.compatibleModels,
        reviews: [],
        changelog: ['Initial upload'],
      };

      this.state.myItems.push(item);
      this.allItems.push(item);

      this.emit('item:uploaded', item);
      this.emit('state:changed', this.state);

      return item;
    } catch (error) {
      this.state.error = 'Failed to upload item';
      this.emit('error', this.state.error);
      return null;
    }
  }

  /**
   * Update item
   */
  async updateItem(itemId: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem | null> {
    const index = this.allItems.findIndex(item => item.id === itemId);
    if (index === -1) return null;

    const item = {
      ...this.allItems[index],
      ...updates,
      updatedAt: Date.now(),
    };

    this.allItems[index] = item;

    // Update in myItems
    const myIndex = this.state.myItems.findIndex(i => i.id === itemId);
    if (myIndex !== -1) {
      this.state.myItems[myIndex] = item;
    }

    this.emit('item:updated', item);
    this.emit('state:changed', this.state);

    return item;
  }

  /**
   * Delete item
   */
  async deleteItem(itemId: string): Promise<boolean> {
    const index = this.allItems.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    this.allItems.splice(index, 1);

    // Remove from myItems
    const myIndex = this.state.myItems.findIndex(i => i.id === itemId);
    if (myIndex !== -1) {
      this.state.myItems.splice(myIndex, 1);
    }

    this.emit('item:deleted', itemId);
    this.emit('state:changed', this.state);

    return true;
  }

  // ============ Reviews ============

  /**
   * Add review
   */
  async addReview(itemId: string, rating: number, text: string): Promise<MarketplaceReview | null> {
    const item = this.getItem(itemId);
    if (!item) return null;

    const review: MarketplaceReview = {
      id: generateUUID(),
      authorId: 'current-user',
      authorName: 'Me',
      rating,
      text,
      createdAt: Date.now(),
      helpfulVotes: 0,
    };

    item.reviews.push(review);

    // Update rating
    const totalRating = item.reviews.reduce((sum, r) => sum + r.rating, 0);
    item.rating.average = totalRating / item.reviews.length;
    item.rating.count = item.reviews.length;
    item.rating.distribution[rating as 1|2|3|4|5]++;

    this.emit('review:added', review);
    this.emit('item:updated', item);
    this.emit('state:changed', this.state);

    return review;
  }

  // ============ Collections ============

  private collections: MarketplaceCollection[] = [];

  /**
   * Get collections
   */
  getCollections(): MarketplaceCollection[] {
    return this.collections;
  }

  /**
   * Create collection
   */
  createCollection(name: string, description: string): MarketplaceCollection {
    const collection: MarketplaceCollection = {
      id: generateUUID(),
      name,
      description,
      author: {
        id: 'current-user',
        username: 'me',
        displayName: 'Me',
        avatarUrl: null,
        isVerified: false,
        bio: null,
        followers: 0,
        totalDownloads: 0,
      },
      items: [],
      isPublic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.collections.push(collection);
    return collection;
  }

  /**
   * Add item to collection
   */
  addToCollection(collectionId: string, item: MarketplaceItem): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return false;

    if (collection.items.some(i => i.id === item.id)) return false;

    collection.items.push(item);
    collection.updatedAt = Date.now();

    return true;
  }

  // ============ State ============

  /**
   * Get current state
   */
  getState(): MarketplaceState {
    return { ...this.state };
  }

  /**
   * Set page
   */
  setPage(page: number): void {
    this.state.currentPage = page;
    this.emit('state:changed', this.state);
  }

  /**
   * Set loading
   */
  setLoading(loading: boolean): void {
    this.state.isLoading = loading;
    this.emit('state:changed', this.state);
  }

  // ============ Cleanup ============

  /**
   * Dispose service
   */
  dispose(): void {
    this.removeAllListeners();
    MarketplaceService.instance = null;
  }
}

export default MarketplaceService;