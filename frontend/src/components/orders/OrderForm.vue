<template>
    <form class="order-form" @submit.prevent="handleSubmit">
        <div class="form-group">
            <label>Street</label>
            <input v-model="form.street" required />
        </div>
        <div class="form-group">
            <label>City</label>
            <input v-model="form.city" required />
        </div>
        <div class="form-group">
            <label>Country</label>
            <input v-model="form.country" required />
        </div>
        <div class="form-group">
            <label>Zip Code</label>
            <input v-model="form.zipCode" required />
        </div>
        <button type="submit" :disabled="loading">
            {{ loading ? 'Processing...' : 'Place Order' }}
        </button>
    </form>
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
    name: 'OrderForm',
    data() {
        return {
            form: {
                street: '',
                city: '',
                country: '',
                zipCode: ''
            }
        }
    },
    computed: {
        ...mapState('order', ['loading'])
    },
    methods: {
        ...mapActions('order', ['createOrder']),
        async handleSubmit() {
            try {
                await this.createOrder({
                    shippingAddress: { ...this.form }
                })
                this.$router.push('/orders')
            } catch (error) {
                console.error('Order creation failed:', error)
            }
        }
    }
}
</script>