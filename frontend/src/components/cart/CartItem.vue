<template>
  <div class="cart-item" v-if="item">
    <div class="item-image">
      <img :src="item?.bookId.image || '/placeholder.png'" :alt="item?.bookId.title || 'Product image'" @error="handleImageError" />
    </div>
    <div class="item-details">
      <h3>{{ item?.bookId.title || 'Unknown Product' }}</h3>
      <p>Price: ${{ item?.price || 0 }}</p>
      <div class="quantity-controls">
        <button @click="updateQuantity(item?.bookId._id, (item?.quantity || 0) - 1)">-</button>
        <span>{{ item?.quantity || 0 }}</span>
        <button @click="updateQuantity(item?.bookId._id, (item?.quantity || 0) + 1)">+</button>
      </div>
    </div>
    <button @click="remove">Remove</button>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'CartItem',
  props: {
    item: {
      type: Object,
      required: true,
      validator: function(item) {
        return item && 
               typeof item.bookId === 'object' &&
               typeof item.bookId._id === 'string' &&
               typeof item.bookId.title === 'string' &&
               typeof item.quantity === 'number' &&
               typeof item.price === 'number'
      }
    }
  },
  emits: ['error', 'update-quantity'],
  methods: {
    ...mapActions('cart', ['updateCartQuantity', 'removeFromCart']),
    async updateQuantity(id, newQuantity) {
      if (newQuantity >= 0) {
        try {
          await this.updateCartQuantity({
            bookId: id,
            quantity: newQuantity,
          })
          this.$emit('update-quantity', { id, quantity: newQuantity })
        } catch (error) {
          this.$emit('error', error.message)
        }
      }
    },
    async remove() {
      try {
        await this.removeFromCart(this.item.bookId._id)
      } catch (error) {
        this.$emit('error', error.message)
      }
    },
    handleImageError(e) {
      e.target.src = require('@/assets/images/placeholder.png')
    }
  },
}
</script>

<style scoped>
.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--gray-medium);
}

.item-details {
    flex: 1;
}

.item-image {
    width: 100px;
    height: auto;
    margin-right: 1rem;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.price {
    font-weight: bold;
}

.remove-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: var(--error-color);
    color: var(--white);
    cursor: pointer;
}
</style>
