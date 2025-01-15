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
                    @remove="handleRemoveFromCart"
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
import { mapGetters, mapActions } from 'vuex';
import CartItem from './CartItem.vue';
import LoadingSpinner from '../common/LoadingSpinner.vue';
import ErrorMessage from '../common/ErrorMessage.vue';
import { CART } from '@/store/types';

export default {
    name: 'CartList',

    components: {
        CartItem,
        LoadingSpinner,
        ErrorMessage,
    },

    computed: {
        ...mapGetters('cart', ['cartItems', 'cartLoading', 'cartError', 'cartTotal', 'itemCount']),
        ...mapGetters('auth', ['isAuthenticated']),
        loading() {
            return this.cartLoading;
        },
        error() {
            return this.cartError;
        },
    },

    watch: {
        isAuthenticated: {
            immediate: true,
            async handler(newVal) {
                if (newVal) {
                    try {
                        await this[CART.FETCH_CART]();
                    } catch (error) {
                        console.error('Error fetching cart on auth change:', error);
                    }
                }
            },
        },
    },

    async created() {
        if (this.isAuthenticated) {
            try {
                await this[CART.FETCH_CART]();
            } catch (error) {
                console.error('Error initializing cart in created hook:', error);
            }
        }
    },

    methods: {
        ...mapActions('cart', [CART.FETCH_CART, 'removeFromCart', 'updateQuantity']),
        handleRemoveFromCart(bookId) {
            this.removeFromCart(bookId);
        },
    },
};
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
