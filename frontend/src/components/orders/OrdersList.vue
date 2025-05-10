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
import { useAuthStore, useOrdersStore, useOrdersUiStore } from '@/stores';
import { mapActions, mapGetters } from 'pinia';

/**
 * Component for displaying and managing user orders
 */
export default {
  name: 'OrdersList',
  components: {
    ErrorMessage,
    LoadingSpinner
  },
    computed: {
    ...mapGetters(useOrdersStore, {
      orders: 'ordersList',
      loading: 'loading',
      error: 'error'
    }),
    ...mapGetters(useOrdersUiStore, [
      'getStatusOptions',
      'getSortOptions',
      'displayedOrders',
      'pageCount'
    ]),
    ...mapGetters(useAuthStore, ['hasPermission']),
    
    // Aliases for better readability
    statusOptions() {
      return this.getStatusOptions;
    },
    sortOptions() {
      return this.getSortOptions;
    },    statusFilter: {
      get() {
        return this.ordersUiStore.getStatusFilter;
      },
      set(value) {
        this.ordersUiStore.applyFilter(value);
      }
    },
    
    sortBy: {
      get() {
        return this.ordersUiStore.getSortBy;
      },
      set(value) {
        this.ordersUiStore.applySort(value);
      }
    },
    
    currentPage: {
      get() {
        return this.ordersUiStore.getCurrentPage;
      },
      set(value) {
        this.ordersUiStore.currentPage = value;
        // Scroll to top when changing page
        window.scrollTo(0, 0);
      }
    },
    
    ordersStore() {
      return useOrdersStore();
    },
    
    ordersUiStore() {
      return useOrdersUiStore();
    }
  },
    async created() {
    await this.fetchOrders();
  },
  
  methods: {    ...mapActions(useOrdersUiStore, [
      'fetchOrders',
      'getStatusColor',
      'getStatusIcon',
      'formatDate',
      'formatPrice',
      'clearError'
    ])
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
