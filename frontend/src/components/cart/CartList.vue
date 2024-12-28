<template>
    <div class="cart-list">
        <div v-if="loading" class="loading-container">
            <loading-spinner />
        </div>

        <div v-else>
            <cart-item
                v-for="item in items"
                :key="item.id"
                :item="item"
                @remove="removeFromCart(item.id)"
                @update-quantity="updateQuantity"
            />
        </div>

        <div v-if="error" class="error-container">
            <error-message :message="error" />
        </div>

        <div class="cart-summary">
            <p>Total Items: {{ itemCount }}</p>
            <p>Total Price: ${{ cartTotal }}</p>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import CartItem from './CartItem.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import ErrorMessage from '../common/ErrorMessage.vue'

export default {
    name: 'CartList',

    components: {
        CartItem,
        LoadingSpinner,
        ErrorMessage,
    },

    computed: {
        ...mapGetters('cart', ['cartItems', 'cartLoading', 'cartError', 'cartTotal', 'itemCount']),
        items() {
            return this.cartItems
        },
        loading() {
            return this.cartLoading
        },
        error() {
            return this.cartError
        },
    },

    methods: {
        ...mapActions('cart', ['removeFromCart', 'updateQuantity']),
    },
}
</script>

<style scoped>
.cart-list {
    padding: 1rem;
}

.loading-container {
    display: flex;
    justify-content: center;
    padding: 2rem;
}

.error-container {
    max-width: 600px;
    margin: 2rem auto;
}

.cart-summary {
    margin-top: 2rem;
    text-align: right;
}
</style>
