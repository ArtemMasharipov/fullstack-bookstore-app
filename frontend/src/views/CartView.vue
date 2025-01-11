<template>
  <div class="cart-view">
    <h1>Your Cart</h1>
    <cart-list />
  </div>
</template>

<script>
import CartList from '@/components/cart/CartList.vue';

export default {
  name: 'CartView',
  components: {
    CartList,
  },
};
</script>

<style scoped>
.cart-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.cart-view h1 {
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
}
</style>