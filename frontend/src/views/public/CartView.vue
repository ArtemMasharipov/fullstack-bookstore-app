<template>
    <v-container class="py-6">
        <div class="d-flex align-center justify-space-between mb-6">
            <h1 class="text-h4 font-weight-bold">Your Cart</h1>
            <v-btn variant="text" to="/books" prepend-icon="mdi-arrow-left"> Continue Shopping </v-btn>
        </div>
        <cart-list />
    </v-container>
</template>

<script setup>
import CartList from '@/components/features/cart/CartList.vue'
</script>
