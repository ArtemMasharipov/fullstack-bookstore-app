<template>
  <div class="order-status">
    <h2>Update Order Status</h2>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="order-details">
      <p>Order ID: {{ order._id }}</p>
      <p>Current Status: {{ order.status }}</p>
      
      <div class="status-update">
        <select v-model="newStatus">
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button :disabled="newStatus === order.status" @click="updateStatus">
          Update Status
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'OrderStatusView',
  data() {
    return {
      newStatus: '',
    }
  },
  computed: {
    ...mapGetters('order', ['currentOrder', 'loading', 'error']),
    order() {
      return this.currentOrder || {}
    }
  },
  async created() {
    await this.fetchOrderById(this.$route.params.id)
    this.newStatus = this.order.status
  },
  methods: {
    ...mapActions('order', ['fetchOrderById', 'updateOrderStatus']),
    async updateStatus() {
      try {
        await this.updateOrderStatus({
          id: this.$route.params.id,
          status: this.newStatus
        })
        this.$router.push(`/orders/${this.$route.params.id}`)
      } catch (error) {
        console.error('Failed to update order status:', error)
      }
    }
  }
}
</script>

<style scoped>
.order-status {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
}

.status-update {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}

select {
  padding: 0.5rem;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: var(--gray-medium);
  cursor: not-allowed;
}
</style>
