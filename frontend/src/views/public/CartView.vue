<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" lg="10">
                <h1 class="text-h4 text-center mb-6">Your Cart</h1>
                <cart-list />
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import CartList from '@/components/features/cart/CartList.vue'
</script>
