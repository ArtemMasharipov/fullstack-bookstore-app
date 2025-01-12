<template>
    <div class="cart-list">
        <div v-if="loading" class="loading-container">
            <loading-spinner />
        </div>

        <div v-else>
            <div v-if="!cartItems.length" class="empty-cart">
                Your cart is empty
            </div>
            <div v-else>
                <cart-item
                    v-for="item in cartItems"
                    :key="item.bookId._id"
                    :item="item"
                    @remove="removeFromCart"
                    @update-quantity="updateQuantity"
                />
                <div class="cart-actions">
                    <router-link 
                        v-if="isAuthenticated" 
                        to="/checkout" 
                        class="btn btn-primary"
                    >
                        Proceed to Checkout
                    </router-link>
                    <router-link 
                        v-else 
                        to="/login" 
                        class="btn btn-primary"
                    >
                        Login to Checkout
                    </router-link>
                </div>
            </div>
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
import { mapGetters, mapActions, mapState } from 'vuex'
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
        ...mapState('auth', ['isAuthenticated']),
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
        removeFromCart(bookId) {
            this.$store.dispatch('cart/removeFromCart', bookId)
        }
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
