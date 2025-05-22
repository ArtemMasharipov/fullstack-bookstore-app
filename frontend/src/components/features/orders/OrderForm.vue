<template>
    <v-form class="order-form" @submit.prevent="handleSubmit">
        <v-text-field v-model="form.street" label="Street" variant="outlined" required></v-text-field>

        <v-text-field v-model="form.city" label="City" variant="outlined" required></v-text-field>

        <v-text-field v-model="form.country" label="Country" variant="outlined" required></v-text-field>

        <v-text-field v-model="form.zipCode" label="Zip Code" variant="outlined" required></v-text-field>

        <v-btn type="submit" color="primary" block :loading="loading">
            {{ loading ? 'Processing...' : 'Place Order' }}
        </v-btn>
    </v-form>
</template>

<script>
import { useOrdersStore } from '@/store'

export default {
    name: 'OrderForm',
    data() {
        return {
            form: {
                street: '',
                city: '',
                country: '',
                zipCode: '',
            },
        }
    },
    computed: {
        ordersStore() {
            return useOrdersStore()
        },
        loading() {
            return this.ordersStore.loading
        },
    },
    methods: {
        async handleSubmit() {
            try {
                await this.ordersStore.createOrder({
                    shippingAddress: { ...this.form },
                })
                this.$router.push('/orders')
            } catch (error) {
                // Notification is already handled by the store
            }
        },
    },
}
</script>
