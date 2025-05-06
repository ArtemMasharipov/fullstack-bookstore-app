<template>
  <div>
    <!-- Loading state -->
    <v-container v-if="loading" class="py-8">
      <v-skeleton-loader
        type="card-heading, list-item-three-line, list-item-three-line, actions"
        class="mx-auto"
      ></v-skeleton-loader>
    </v-container>
    
    <!-- Error state -->
    <v-container v-else-if="error" class="py-5">
      <error-message 
        :message="error" 
        type="error"
        icon="mdi-alert-circle"
        @close="clearError"
      />
      
      <div class="d-flex justify-center mt-4">
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          @click="fetchOrders"
        >
          Retry
        </v-btn>
      </div>
    </v-container>
    
    <!-- Empty state -->
    <v-container v-else-if="orders.length === 0" class="py-8">
      <v-alert
        type="info"
        variant="tonal"
        class="text-center"
        icon="mdi-package-variant"
        border="start"
      >
        <p class="mb-2">No orders found</p>
        <v-btn
          color="primary"
          variant="text"
          to="/books"
          prepend-icon="mdi-shopping"
        >
          Start shopping
        </v-btn>
      </v-alert>
    </v-container>
    
    <!-- Orders list -->
    <v-container v-else fluid class="pa-4">
      <v-card
        flat
        class="mb-4"
      >
        <v-card-title class="text-h5 pb-2">
          Your Orders
          <v-chip class="ml-2" size="small" color="primary">{{ orders.length }}</v-chip>
        </v-card-title>
        
        <v-card-text>
          <v-row dense>
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="statusFilter"
                label="Filter by status"
                :items="statusOptions"
                variant="outlined"
                density="comfortable"
                clearable
                hide-details
                prepend-inner-icon="mdi-filter-variant"
                @update:model-value="applyFilter"
              ></v-select>
            </v-col>
            
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="sortBy"
                label="Sort by"
                :items="sortOptions"
                variant="outlined"
                density="comfortable"
                hide-details
                prepend-inner-icon="mdi-sort"
                @update:model-value="applySort"
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      
      <transition-group name="order-list" tag="div">
        <v-card 
          v-for="order in displayedOrders" 
          :key="order._id" 
          class="mb-4"
          variant="outlined"
          :elevation="1"
          hover
        >
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar color="primary" rounded class="mr-3">
                <v-icon icon="mdi-package-variant" color="white"></v-icon>
              </v-avatar>
            </template>
            
            <v-card-title class="text-h6">
              Order #{{ order._id.substring(order._id.length - 8) }}
            </v-card-title>
            
            <v-card-subtitle>
              {{ formatDate(order.createdAt) }}
            </v-card-subtitle>
          </v-card-item>
          
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" sm="6" md="4">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-currency-usd" size="small" class="mr-1"></v-icon>
                  <span class="text-body-1 font-weight-medium">
                    Total: ${{ formatPrice(order.total) }}
                  </span>
                </div>
              </v-col>
              
              <v-col cols="12" sm="6" md="4">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-book-multiple" size="small" class="mr-1"></v-icon>
                  <span class="text-body-2">
                    Items: {{ order.items?.length || 0 }}
                  </span>
                </div>
              </v-col>
              
              <v-col cols="12" sm="12" md="4" class="d-flex justify-start justify-md-end mt-2 mt-md-0">
                <v-chip
                  :color="getStatusColor(order.status)"
                  variant="tonal"
                  class="text-uppercase font-weight-medium"
                  :prepend-icon="getStatusIcon(order.status)"
                >
                  {{ order.status }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            
            <v-btn
              color="primary"
              variant="text"
              :to="`/orders/${order._id}`"
              prepend-icon="mdi-eye"
              density="comfortable"
            >
              View Details
            </v-btn>
            
            <v-btn
              v-if="hasPermission('update:order')"
              color="warning"
              variant="text"
              :to="`/orders/${order._id}/status`"
              prepend-icon="mdi-pencil"
              density="comfortable"
            >
              Update Status
            </v-btn>
          </v-card-actions>
        </v-card>
      </transition-group>
      
      <!-- Pagination if needed -->
      <v-pagination
        v-if="pageCount > 1"
        v-model="currentPage"
        :length="pageCount"
        rounded
        class="mt-6"
        color="primary"
      ></v-pagination>
    </v-container>
  </div>
</template>

<script>
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useAuthStore, useOrdersStore } from '@/stores';

/**
 * Component for displaying and managing user orders
 */
export default {
  name: 'OrdersList',
  components: {
    ErrorMessage,
    LoadingSpinner
  },
  
  data() {
    return {
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
    };
  },
  
  computed: {
    ordersStore() {
      return useOrdersStore();
    },
    
    authStore() {
      return useAuthStore();
    },
    
    ordersList() {
      return this.ordersStore.ordersList;
    },
    
    loading() {
      return this.ordersStore.loading;
    },
    
    error() {
      return this.ordersStore.error;
    },
    
    hasPermission() {
      return this.authStore.hasPermission;
    },
    
    orders() {
      return this.ordersList || [];
    },
    
    /**
     * Filter and sort orders based on selected criteria
     */
    filteredOrders() {
      let result = [...this.orders];
      
      // Apply status filter
      if (this.statusFilter) {
        result = result.filter(order => order.status === this.statusFilter);
      }
      
      // Apply sort
      switch (this.sortBy) {
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
    displayedOrders() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredOrders.slice(start, end);
    },
    
    /**
     * Calculate total page count
     */
    pageCount() {
      return Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    }
  },
  
  watch: {
    currentPage() {
      // Scroll to top when changing page
      window.scrollTo(0, 0);
    }
  },
  
  async created() {
    await this.fetchOrders();
  },
  
  methods: {
    /**
     * Fetch orders from API
     */
    async fetchOrders() {
      try {
        return await this.ordersStore.fetchOrders();
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    },
    
    /**
     * Reset error state
     */
    clearError() {
      this.ordersStore.clearError();
    },
    
    /**
     * Apply status filter
     */
    applyFilter() {
      this.currentPage = 1; // Reset to first page when filtering
    },
    
    /**
     * Apply sorting
     */
    applySort() {
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
};
</script>

<style scoped>
.order-list-move, 
.order-list-enter-active,
.order-list-leave-active {
  transition: all 0.5s ease;
}

.order-list-enter-from,
.order-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.order-list-leave-active {
  position: absolute;
}
</style>
