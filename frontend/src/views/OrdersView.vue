<template>
  <div class="orders">
    <h2>My Orders</h2>
    <orders-list />
  </div>
</template>

<script>
import OrdersList from '@/components/orders/OrdersList.vue'

export default {
  name: 'OrdersView',
  components: {
    OrdersList
  }
}
</script>

<style scoped>
.orders {
  padding: 2rem;
}

h2 {
  margin-bottom: 2rem;
}
</style>
