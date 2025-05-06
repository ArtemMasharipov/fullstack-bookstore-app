<template>
  <div class="stock-status">
    <v-chip 
      :color="isInStock ? 'success' : 'error'" 
      size="small" 
      class="text-uppercase"
    >
      {{ isInStock ? 'In Stock' : 'Out of Stock' }}
    </v-chip>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  inStock: {
    type: [Boolean, String, Number],
    default: false
  }
})

// Computed
const isInStock = computed(() => {
  console.log(`StockStatusDisplay received inStock=${props.inStock} (${typeof props.inStock})`)
  
  // Enhanced checks for all common true value representations
  if (props.inStock === true || 
      props.inStock === 'true' || 
      props.inStock === 1 || 
      props.inStock === '1' || 
      props.inStock === 'yes' ||
      props.inStock === 'Yes' ||
      props.inStock === 'YES' ||
      props.inStock === 'y' ||
      (typeof props.inStock === 'object' && props.inStock !== null)) {
    console.log("Determined as IN STOCK")
    return true
  }
  
  console.log("Determined as OUT OF STOCK")
  return false
})
</script>
