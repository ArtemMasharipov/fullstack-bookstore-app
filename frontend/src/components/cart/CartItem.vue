<template>
    <div class="cart-item">
        <div class="item-image">
            <img :src="bookImage" :alt="bookTitle" @error="handleImageError" />
        </div>
        <div class="item-details">
            <h3>{{ bookTitle }}</h3>
            <p>Price: ${{ formattedPrice }}</p>
            <quantity-control
                :value="item.quantity"
                :min="1"
                @update="handleQuantityClick"
            />
        </div>
        <button class="remove-btn" @click="remove">Remove</button>
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
            validator: ({ bookId, quantity, price }) => 
                bookId && Number.isFinite(quantity) && Number.isFinite(price)
        }
    },
    emits: ['error', 'update-quantity'],
    computed: {
        bookTitle() {
            const { title = 'Unknown Book' } = this.item.bookId || {}
            return title
        },
        bookImage() {
            return this.item?.bookId?.image || require('@/assets/images/placeholder.png')
        },
        formattedPrice() {
            return Number(this.item.price).toFixed(2)
        }
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
        handleQuantityClick: debounce(function(quantity) {
            if (quantity >= 1) {
                this.updateQuantity({ 
                    bookId: this.item.bookId._id, 
                    quantity 
                })
            }
        }, 300)
    }
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
