<template>
    <v-container>
        <v-row>
            <v-col>
                <h1 class="text-h3 mb-6">My Orders</h1>
                <orders-list />
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import OrdersList from '@/components/features/orders/OrdersList.vue'

export default {
    name: 'OrdersView',
    components: {
        OrdersList,
    },
}
</script>
