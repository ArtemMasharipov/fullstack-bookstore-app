<template>
  <div class="orders-list">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-for="order in orders" :key="order._id" class="order-item">
        <div class="order-header">
          <h3>Order #{{ order._id }}</h3>
          <span :class="['status', order.status]">{{ order.status }}</span>
        </div>
        <div class="order-details">
          <p>Date: {{ new Date(order.createdAt).toLocaleDateString() }}</p>
          <p>Total: ${{ order.total }}</p>
        </div>
        <div class="order-actions">
          <router-link :to="`/orders/${order._id}`" class="btn-view">
            View Details
          </router-link>
          <router-link 
            v-if="hasPermission('update:order')"
            :to="`/orders/${order._id}/status`" 
            class="btn-edit"
          >
            Update Status
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'OrdersList',
  computed: {
    ...mapGetters('order', ['ordersList', 'loading', 'error']),
    ...mapGetters('auth', ['hasPermission']),
    orders() {
      return this.ordersList
    }
  },
  async created() {
    await this.fetchOrders()
  },
  methods: {
    ...mapActions('order', ['fetchOrders'])
  }
}
</script>

<style scoped>
.orders-list {
  max-width: 800px;
  margin: 0 auto;
}

.order-item {
  border: 1px solid var(--gray-light);
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 4px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.status.pending { background-color: var(--warning-color); }
.status.processing { background-color: var(--info-color); }
.status.shipped { background-color: var(--success-color); }
.status.delivered { background-color: var(--primary-color); }
.status.cancelled { background-color: var(--error-color); }

.order-actions {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

.btn-view, .btn-edit {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
}

.btn-view {
  background-color: var(--primary-color);
  color: white;
}

.btn-edit {
  background-color: var(--warning-color);
  color: white;
}
</style>
