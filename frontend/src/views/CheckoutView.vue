<template>
  <div class="checkout">
    <h2>Checkout</h2>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="order-summary">
        <h3>Order Summary</h3>
        <div v-for="item in cartItems" :key="item.id" class="order-item">
          <span>{{ item.title }}</span>
          <span>{{ item.quantity }} x ${{ item.price }}</span>
        </div>
        <div class="total">
          <strong>Total: ${{ cartTotal }}</strong>
        </div>
      </div>

      <form @submit.prevent="submitOrder" class="checkout-form">
        <div class="form-group">
          <label for="address">Shipping Address</label>
          <textarea 
            id="address" 
            v-model="orderData.address" 
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input 
            id="phone" 
            type="tel" 
            v-model="orderData.phone" 
            required
          />
        </div>

        <button type="submit" :disabled="loading">
          Place Order
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'CheckoutView',
  data() {
    return {
      orderData: {
        address: '',
        phone: ''
      }
    }
  },
  computed: {
    ...mapGetters('cart', ['cartItems', 'cartTotal', 'loading', 'error'])
  },
  methods: {
    ...mapActions('order', ['createOrder']),
    async submitOrder() {
      try {
        const order = await this.createOrder({
          ...this.orderData,
          items: this.cartItems,
          total: this.cartTotal
        })
        this.$router.push(`/orders/${order._id}`)
      } catch (error) {
        console.error('Failed to create order:', error)
      }
    }
  }
}
</script>

<style scoped>
.checkout {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.order-summary {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid var(--gray-light);
  border-radius: 4px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
}

.total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-light);
  text-align: right;
}

.checkout-form {
  max-width: 500px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input, textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--gray-medium);
  border-radius: 4px;
}

textarea {
  height: 100px;
}

button {
  width: 100%;
  padding: 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: var(--gray-medium);
}
</style>
