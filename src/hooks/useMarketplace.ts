/**
 * useMarketplace - React hook for marketplace functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketplaceService } from '../services/MarketplaceService';
import {
  MarketplaceItem,
  MarketplaceItemType,
  MarketplaceCategory,
  MarketplaceFilters,
  MarketplaceUpload,
  MarketplaceReview,
  MarketplaceState,
  MarketplaceCollection,
  MarketplaceSortBy,
  DEFAULT_MARKETPLACE_FILTERS,
  ModelType,
} from '../types/vtuber';

export interface UseMarketplaceReturn {
  // State
  items: MarketplaceItem[];
  featured: MarketplaceItem[];
  myItems: MarketplaceItem[];
  favorites: string[];
  downloads: string[];
  selectedItem: MarketplaceItem | null;
  isLoading: boolean;
  error: string | null;
  filters: MarketplaceFilters;
  totalCount: number;
  currentPage: number;

  // Item actions
  searchItems: (filters?: Partial<MarketplaceFilters>) => Promise<MarketplaceItem[]>;
  selectItem: (item: MarketplaceItem | null) => void;
  getItem: (id: string) => MarketplaceItem | undefined;
  downloadItem: (itemId: string) => Promise<boolean>;

  // Favorite actions
  addToFavorites: (itemId: string) => boolean;
  removeFromFavorites: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => boolean;
  isFavorite: (itemId: string) => boolean;

  // Upload actions
  uploadItem: (upload: MarketplaceUpload) => Promise<MarketplaceItem | null>;
  updateItem: (itemId: string, updates: Partial<MarketplaceItem>) => Promise<MarketplaceItem | null>;
  deleteItem: (itemId: string) => Promise<boolean>;

  // Review actions
  addReview: (itemId: string, rating: number, text: string) => Promise<MarketplaceReview | null>;

  // Collection actions
  getCollections: () => MarketplaceCollection[];
  createCollection: (name: string, description: string) => MarketplaceCollection;
  addToCollection: (collectionId: string, item: MarketplaceItem) => boolean;

  // Filter actions
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;

  // Quick filter helpers
  filterByType: (type: MarketplaceItemType | null) => void;
  filterByCategory: (category: MarketplaceCategory | null) => void;
  filterFreeOnly: () => void;
  filterByCompatibility: (modelType: ModelType | null) => void;
}

export function useMarketplace(): UseMarketplaceReturn {
  const serviceRef = useRef<MarketplaceService | null>(null);
  
  // State
  const [state, setState] = useState<MarketplaceState>({
    items: [],
    featured: [],
    myItems: [],
    favorites: [],
    downloads: [],
    filters: DEFAULT_MARKETPLACE_FILTERS,
    selectedItem: null,
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    itemsPerPage: 20,
  });

  // Initialize service
  useEffect(() => {
    const service = MarketplaceService.getInstance();
    serviceRef.current = service;

    // Set initial values
    setState(service.getState());

    // Load initial items
    service.searchItems();

    // Event listeners
    const onStateChanged = (newState: MarketplaceState) => {
      setState({ ...newState });
    };

    service.on('state:changed', onStateChanged);

    return () => {
      service.off('state:changed', onStateChanged);
    };
  }, []);

  // Item actions
  const searchItems = useCallback(async (filters?: Partial<MarketplaceFilters>): Promise<MarketplaceItem[]> => {
    if (!serviceRef.current) return [];
    return serviceRef.current.searchItems(filters);
  }, []);

  const selectItem = useCallback((item: MarketplaceItem | null): void => {
    if (!serviceRef.current) return;
    serviceRef.current.selectItem(item);
  }, []);

  const getItem = useCallback((id: string): MarketplaceItem | undefined => {
    if (!serviceRef.current) return undefined;
    return serviceRef.current.getItem(id);
  }, []);

  const downloadItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!serviceRef.current) return false;
    return serviceRef.current.downloadItem(itemId);
  }, []);

  // Favorite actions
  const addToFavorites = useCallback((itemId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.addToFavorites(itemId);
  }, []);

  const removeFromFavorites = useCallback((itemId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.removeFromFavorites(itemId);
  }, []);

  const toggleFavorite = useCallback((itemId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.toggleFavorite(itemId);
  }, []);

  const isFavorite = useCallback((itemId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.isFavorite(itemId);
  }, []);

  // Upload actions
  const uploadItem = useCallback(async (upload: MarketplaceUpload): Promise<MarketplaceItem | null> => {
    if (!serviceRef.current) return null;
    return serviceRef.current.uploadItem(upload);
  }, []);

  const updateItem = useCallback(async (itemId: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem | null> => {
    if (!serviceRef.current) return null;
    return serviceRef.current.updateItem(itemId, updates);
  }, []);

  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!serviceRef.current) return false;
    return serviceRef.current.deleteItem(itemId);
  }, []);

  // Review actions
  const addReview = useCallback(async (itemId: string, rating: number, text: string): Promise<MarketplaceReview | null> => {
    if (!serviceRef.current) return null;
    return serviceRef.current.addReview(itemId, rating, text);
  }, []);

  // Collection actions
  const getCollections = useCallback((): MarketplaceCollection[] => {
    if (!serviceRef.current) return [];
    return serviceRef.current.getCollections();
  }, []);

  const createCollection = useCallback((name: string, description: string): MarketplaceCollection => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }
    return serviceRef.current.createCollection(name, description);
  }, []);

  const addToCollection = useCallback((collectionId: string, item: MarketplaceItem): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.addToCollection(collectionId, item);
  }, []);

  // Filter actions
  const setFilters = useCallback((filters: Partial<MarketplaceFilters>): void => {
    if (!serviceRef.current) return;
    serviceRef.current.searchItems(filters);
  }, []);

  const resetFilters = useCallback((): void => {
    if (!serviceRef.current) return;
    serviceRef.current.searchItems(DEFAULT_MARKETPLACE_FILTERS);
  }, []);

  const setPage = useCallback((page: number): void => {
    if (!serviceRef.current) return;
    serviceRef.current.setPage(page);
  }, []);

  // Quick filter helpers
  const filterByType = useCallback((type: MarketplaceItemType | null): void => {
    if (!serviceRef.current) return;
    const types = type ? [type] : [];
    serviceRef.current.searchItems({ types });
  }, []);

  const filterByCategory = useCallback((category: MarketplaceCategory | null): void => {
    if (!serviceRef.current) return;
    const categories = category ? [category] : [];
    serviceRef.current.searchItems({ categories });
  }, []);

  const filterFreeOnly = useCallback((): void => {
    if (!serviceRef.current) return;
    serviceRef.current.searchItems({ priceRange: [0, 0] });
  }, []);

  const filterByCompatibility = useCallback((modelType: ModelType | null): void => {
    if (!serviceRef.current) return;
    serviceRef.current.searchItems({ compatibleWith: modelType });
  }, []);

  return {
    // State
    items: state.items,
    featured: state.featured,
    myItems: state.myItems,
    favorites: state.favorites,
    downloads: state.downloads,
    selectedItem: state.selectedItem,
    isLoading: state.isLoading,
    error: state.error,
    filters: state.filters,
    totalCount: state.totalCount,
    currentPage: state.currentPage,

    // Item actions
    searchItems,
    selectItem,
    getItem,
    downloadItem,

    // Favorite actions
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,

    // Upload actions
    uploadItem,
    updateItem,
    deleteItem,

    // Review actions
    addReview,

    // Collection actions
    getCollections,
    createCollection,
    addToCollection,

    // Filter actions
    setFilters,
    resetFilters,
    setPage,

    // Quick filter helpers
    filterByType,
    filterByCategory,
    filterFreeOnly,
    filterByCompatibility,
  };
}

export default useMarketplace;