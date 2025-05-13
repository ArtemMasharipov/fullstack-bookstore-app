import { defineStore } from 'pinia';
import { useOrdersStore } from './orders';
import { toast } from '.';

/**
 * Store for managing Orders UI state and interactions
 * Handles order filtering, sorting, pagination and UI helpers
 */
export const useOrdersUiStore = defineStore('ordersUi', {
  state: () => ({
    statusFilter: null,
    sortBy: 'newest',
    currentPage: 1,
    itemsPerPage: 5,
    statusOptions: [
      { title: 'All Orders', value: null },
      { title: 'Pending', value: 'pending' },
      { title: 'Processing', value: 'processing' },
      { title: 'Shipped', value: 'shipped' },
      { title: 'Delivered', value: 'delivered' },
      { title: 'Cancelled', value: 'cancelled' }
    ],
    sortOptions: [
      { title: 'Newest First', value: 'newest' },
      { title: 'Oldest First', value: 'oldest' },
      { title: 'Highest Total', value: 'total-desc' },
      { title: 'Lowest Total', value: 'total-asc' }
    ]
  }),
    getters: {
    /**
     * Get status filter
     */
    getStatusFilter: (state) => state.statusFilter,

    /**
     * Get sort by option
     */
    getSortBy: (state) => state.sortBy,

    /**
     * Get current page
     */
    getCurrentPage: (state) => state.currentPage,

    /**
     * Get items per page
     */
    getItemsPerPage: (state) => state.itemsPerPage,

    /**
     * Get status options
     */
    getStatusOptions: (state) => state.statusOptions,

    /**
     * Get sort options
     */
    getSortOptions: (state) => state.sortOptions,

    /**
     * Filter and sort orders based on selected criteria
     */
    filteredOrders(state) {
      const ordersStore = useOrdersStore();
      let result = [...ordersStore.ordersList || []];
      
      // Apply status filter
      if (state.statusFilter) {
        result = result.filter(order => order.status === state.statusFilter);
      }
      
      // Apply sort
      switch (state.sortBy) {
        case 'newest':
          result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'total-desc':
          result.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
          break;
        case 'total-asc':
          result.sort((a, b) => parseFloat(a.total) - parseFloat(b.total));
          break;
      }
      
      return result;
    },
    
    /**
     * Get orders for current page
     */
    displayedOrders(state) {
      const start = (state.currentPage - 1) * state.itemsPerPage;
      const end = start + state.itemsPerPage;
      return this.filteredOrders.slice(start, end);
    },
    
    /**
     * Calculate total page count
     */
    pageCount(state) {
      return Math.ceil(this.filteredOrders.length / state.itemsPerPage);
    },
    
    // Add getters for all state properties
    getStatusFilter: (state) => state.statusFilter,
    getSortBy: (state) => state.sortBy,
    getCurrentPage: (state) => state.currentPage,
    getItemsPerPage: (state) => state.itemsPerPage,
    getStatusOptions: (state) => state.statusOptions,
    getSortOptions: (state) => state.sortOptions
  },
  
  actions: {    /**
     * Fetch orders from API
     */
    async fetchOrders() {
      const ordersStore = useOrdersStore();
        try {
        return await ordersStore.fetchOrders();
      } catch (error) {
        // Don't show auth errors since they're handled by the API interceptor
        if (error.status !== 401) {
          toast.error(error.message || "Failed to load orders");
        }
      }
    },
    
    /**
     * Clear error state
     */
    clearError() {
      const ordersStore = useOrdersStore();
      ordersStore.clearError();
    },
    
    /**
     * Apply status filter
     */
    applyFilter(status) {
      this.statusFilter = status;
      this.currentPage = 1; // Reset to first page when filtering
    },
    
    /**
     * Apply sorting
     */
    applySort(sort) {
      this.sortBy = sort;
      this.currentPage = 1; // Reset to first page when sorting
    },
    
    /**
     * Get appropriate color for order status
     */
    getStatusColor(status) {
      const statusColors = {
        pending: 'warning',
        processing: 'info',
        shipped: 'success',
        delivered: 'primary',
        cancelled: 'error'
      };
      return statusColors[status] || 'grey';
    },
    
    /**
     * Get appropriate icon for order status
     */
    getStatusIcon(status) {
      const statusIcons = {
        pending: 'mdi-clock-outline',
        processing: 'mdi-progress-check',
        shipped: 'mdi-truck-delivery-outline',
        delivered: 'mdi-check-circle-outline',
        cancelled: 'mdi-cancel'
      };
      return statusIcons[status] || 'mdi-help-circle-outline';
    },
    
    /**
     * Format date in user-friendly way
     */
    formatDate(dateString) {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },
    
    /**
     * Format price with 2 decimal places
     */
    formatPrice(price) {
      return parseFloat(price).toFixed(2);
    }
  }
})
