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

<script>
export default {
  props: {
    inStock: {
      type: [Boolean, String, Number],
      default: false
    }
  },  computed: {
    isInStock() {
      console.log(`StockStatusDisplay received inStock=${this.inStock} (${typeof this.inStock})`);
      
      // Enhanced checks for all common true value representations
      if (this.inStock === true || 
          this.inStock === 'true' || 
          this.inStock === 1 || 
          this.inStock === '1' || 
          this.inStock === 'yes' ||
          this.inStock === 'Yes' ||
          this.inStock === 'YES' ||
          this.inStock === 'y' ||
          (typeof this.inStock === 'object' && this.inStock !== null)) {
        console.log("Determined as IN STOCK");
        return true;
      }
      
      console.log("Determined as OUT OF STOCK");
      return false;
    }
  }
}
</script>
