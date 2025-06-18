<template>
    <div class="stock-status">
        <v-chip :color="isInStock ? 'success' : 'error'" size="small" class="text-uppercase">
            {{ isInStock ? 'In Stock' : 'Out of Stock' }}
        </v-chip>
    </div>
</template>

<script setup>
import { logger } from '@/utils/logger'
import { computed } from 'vue'

// Props
const props = defineProps({
    inStock: {
        type: [Boolean, String, Number],
        default: false,
    },
})

// Computed
const isInStock = computed(() => {
    logger.debug(`StockStatusDisplay received inStock=${props.inStock} (${typeof props.inStock})`, 'stock-status')

    // Enhanced checks for all common true value representations
    if (
        props.inStock === true ||
        props.inStock === 'true' ||
        props.inStock === 1 ||
        props.inStock === '1' ||
        props.inStock === 'yes' ||
        props.inStock === 'Yes' ||
        props.inStock === 'YES' ||
        props.inStock === 'y' ||
        (typeof props.inStock === 'object' && props.inStock !== null)
    ) {
        logger.debug('Determined as IN STOCK', 'stock-status')
        return true
    }

    logger.debug('Determined as OUT OF STOCK', 'stock-status')
    return false
})
</script>
