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
  padding: 2rem;
}
.cart-view h1 {
  color: #333;
}
</style>