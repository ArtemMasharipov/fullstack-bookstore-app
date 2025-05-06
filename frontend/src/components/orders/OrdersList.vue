<template>
  <div>
    <v-container v-if="loading" class="text-center py-10">
      <loading-spinner />
    </v-container>
    
    <v-container v-else-if="error" class="py-5">
      <error-message :message="error" />
    </v-container>
    
    <v-container v-else>
      <v-card 
        v-for="order in orders" 
        :key="order._id" 
        class="mb-4"
        variant="outlined"
      >
        <v-card-item>
          <v-row align="center">
            <v-col cols="12" sm="6">
              <div class="text-h6">Order #{{ order._id }}</div>
              <div class="text-body-2 mt-1">
                Date: {{ new Date(order.createdAt).toLocaleDateString() }}
              </div>
              <div class="text-body-2 font-weight-medium">
                Total: ${{ order.total }}
              </div>
            </v-col>
            
            <v-col cols="12" sm="6" class="d-flex justify-end">
              <v-chip
                :color="getStatusColor(order.status)"
                class="text-uppercase font-weight-medium"
              >
                {{ order.status }}
              </v-chip>
            </v-col>
          </v-row>
        </v-card-item>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          
          <v-btn
            color="primary"
            variant="text"
            :to="`/orders/${order._id}`"
            prepend-icon="mdi-eye"
          >
            View Details
          </v-btn>
          
          <v-btn
            v-if="hasPermission('update:order')"
            color="warning"
            variant="text"
            :to="`/orders/${order._id}/status`"
            prepend-icon="mdi-pencil"
          >
            Update Status
          </v-btn>
        </v-card-actions>
      </v-card>
      
      <v-alert
        v-if="orders.length === 0"
        type="info"
        variant="tonal"
        class="mt-4 text-center"
      >
        No orders found
      </v-alert>
    </v-container>
  </div>
</template>

<script>
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAuthStore, useOrdersStore } from '@/stores'

export default {
  name: 'OrdersList',
  components: {
    ErrorMessage,
    LoadingSpinner
  },
  computed: {
    ordersStore() {
      return useOrdersStore()
    },
    authStore() {
      return useAuthStore()
    },
    ordersList() {
      return this.ordersStore.ordersList
    },
    loading() {
      return this.ordersStore.loading
    },
    error() {
      return this.ordersStore.error
    },
    hasPermission() {
      return this.authStore.hasPermission
    },
    orders() {
      return this.ordersList
    }
  },
  async created() {
    await this.fetchOrders()
  },
  methods: {
    fetchOrders() {
      return this.ordersStore.fetchOrders()
    },
    getStatusColor(status) {
      const statusColors = {
        pending: 'warning',
        processing: 'info',
        shipped: 'success',
        delivered: 'primary',
        cancelled: 'error'
      }
      return statusColors[status] || 'grey'
    }
  }
}
</script>
