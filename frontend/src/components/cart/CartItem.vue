<template>
    <div class="cart-item">
        <img :src="item.book.image" :alt="item.book.title" class="item-image" />
        <div class="item-details">
            <h3>{{ item.book.title }}</h3>
            <p class="price">${{ item.price }}</p>
            <div class="quantity-controls">
                <button @click="updateQuantity(item.quantity - 1)" :disabled="item.quantity <= 1">-</button>
                <span>{{ item.quantity }}</span>
                <button @click="updateQuantity(item.quantity + 1)">+</button>
            </div>
            <button class="remove-btn" @click="remove">Remove</button>
        </div>
    </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
    props: {
        item: {
            type: Object,
            required: true,
        },
    },
    methods: {
        ...mapActions('cart', ['updateCartQuantity', 'removeFromCart']),
        async updateQuantity(newQuantity) {
            try {
                await this.updateCartQuantity({
                    bookId: this.item.bookId,
                    quantity: newQuantity,
                })
            } catch (error) {
                this.$emit('error', error.message)
            }
        },
        async remove() {
            try {
                await this.removeFromCart(this.item.bookId)
            } catch (error) {
                this.$emit('error', error.message)
            }
        },
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
