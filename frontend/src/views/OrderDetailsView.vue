<template>
  <div class="order-details">
    <h2>Order Details</h2>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="order-info">
      <div class="order-header">
        <h3>Order #{{ order._id }}</h3>
        <span :class="['status', order.status]">{{ order.status }}</span>
      </div>

      <div class="order-items">
        <h4>Items</h4>
        <div v-for="item in order.items" :key="item.id" class="item">
          <span>{{ item.title }}</span>
          <span>{{ item.quantity }} x ${{ item.price }}</span>
        </div>
      </div>

      <div class="order-summary">
        <p><strong>Total:</strong> ${{ order.total }}</p>
        <p><strong>Date:</strong> {{ formatDate(order.createdAt) }}</p>
        <p><strong>Address:</strong> {{ order.address }}</p>
        <p><strong>Phone:</strong> {{ order.phone }}</p>
      </div>

      <div v-if="hasPermission('update:order')" class="order-actions">
        <router-link 
          :to="`/orders/${order._id}/status`" 
          class="btn-update"
        >
          Update Status
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'OrderDetailsView',
  computed: {
    ...mapGetters('order', ['currentOrder', 'loading', 'error']),
    ...mapGetters('auth', ['hasPermission']),
    order() {
      return this.currentOrder || {}
    }
  },
  async created() {
    await this.fetchOrderById(this.$route.params.id)
  },
  methods: {
    ...mapActions('order', ['fetchOrderById']),
    formatDate(date) {
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.order-details {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.status {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
}

.order-items {
  margin: 2rem 0;
  border: 1px solid var(--gray-light);
  border-radius: 4px;
  padding: 1rem;
}

.item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-light);
}

.order-summary {
  margin: 2rem 0;
}

.order-actions {
  margin-top: 2rem;
}

.btn-update {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 4px;
}
</style>
