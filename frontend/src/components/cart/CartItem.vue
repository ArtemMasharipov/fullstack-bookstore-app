<template>
    <div class="cart-item">
        <div class="item-image">
            <img :src="bookImage" :alt="bookTitle" @error="handleImageError" />
        </div>
        <div class="item-details">
            <h3>{{ bookTitle }}</h3>
            <p>Price: ${{ item?.price || 0 }}</p>
            <div class="quantity-controls">
                <button @click="handleQuantityClick((item?.quantity || 0) - 1)">-</button>
                <span>{{ item?.quantity || 0 }}</span>
                <button @click="handleQuantityClick((item?.quantity || 0) + 1)">+</button>
            </div>
        </div>
        <button @click="remove">Remove</button>
    </div>
</template>

<script>
import { mapActions } from 'vuex'
import { debounce } from 'lodash'

export default {
    name: 'CartItem',
    props: {
        item: {
            type: Object,
            required: true,
            validator(value) {
                return value && value.bookId && typeof value.quantity === 'number' && typeof value.price === 'number'
            },
        },
    },
    emits: ['error', 'update-quantity'],
    computed: {
        bookTitle() {
            return this.item?.bookId?.title || 'Unknown Book'
        },
        bookImage() {
            return this.item?.bookId?.image || require('@/assets/images/placeholder.png')
        },
    },
    created() {
        this.debouncedUpdateQuantity = debounce((quantity) => {
            this.updateQuantityInCart(this.item.bookId._id, quantity)
        }, 300)
    },
    beforeUnmount() {
        if (this.debouncedUpdateQuantity) {
            this.debouncedUpdateQuantity.cancel()
        }
    },
    methods: {
        ...mapActions('cart', ['removeFromCart', 'updateQuantity']),
        async remove() {
            try {
                await this.removeFromCart(this.item._id);
            } catch (error) {
                this.$emit('error', error.message);
            }
        },
        handleImageError(e) {
            e.target.src = require('@/assets/images/placeholder.png')
        },
        updateQuantityInCart(bookId, quantity) {
            this.$emit('update-quantity', { bookId, quantity });
            this.updateQuantity({ bookId, quantity }).catch(error => {
                this.$emit('error', error.message);
            });
        },
        handleQuantityClick(newQuantity) {
            if (newQuantity >= 0) {
                this.debouncedUpdateQuantity(newQuantity)
            }
        }
    },
}
</script>

<style scoped>
.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--gray-medium);
}

.item-details {
    flex: 1;
}

.item-image {
    width: 100px;
    height: auto;
    margin-right: 1rem;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.price {
    font-weight: bold;
}

.remove-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: var(--error-color);
    color: var(--white);
    cursor: pointer;
}
</style>
