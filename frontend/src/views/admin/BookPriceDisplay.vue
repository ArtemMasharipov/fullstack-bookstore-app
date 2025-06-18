<template>
    <div class="book-price">
        {{ formatPriceValue(price) }}
    </div>
</template>

<script setup>
import { formatPrice } from '@/utils'

// Props
const props = defineProps({
    price: {
        type: [Number, String],
        default: 0,
    },
})

// Methods moved to template function call
const formatPriceValue = (price) => {
    return formatPrice(price)
}
</script>
