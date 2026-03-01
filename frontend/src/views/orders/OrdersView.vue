<template>
    <v-container>
        <div class="d-flex align-center mb-6">
            <v-avatar color="primary" size="48" class="mr-4">
                <v-icon icon="mdi-package-variant-closed" color="white" />
            </v-avatar>
            <div>
                <h1 class="text-h4 font-weight-bold">My Orders</h1>
                <p class="text-body-2 text-medium-emphasis">Track and manage your purchases</p>
            </div>
        </div>

        <orders-list />
    </v-container>
</template>

<script setup>
import OrdersList from '@/components/features/orders/OrdersList.vue'
</script>
