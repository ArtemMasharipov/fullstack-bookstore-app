<template>
  <div class="book-price">
    {{ formatPrice(price) }}
  </div>
</template>

<script>
import { formatPrice } from '@/utils';

export default {
  props: {
    price: {
      type: [Number, String],
      default: 0
    }
  },  methods: {
    formatPrice(price) {
      return formatPrice(price);
    }
  }
}
</script>
