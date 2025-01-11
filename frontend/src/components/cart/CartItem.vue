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
    padding: 1.5rem;
    margin-bottom: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.item-image {
    width: 120px;
    margin-right: 1.5rem;
}

.item-image img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 4px;
}

.item-details {
    flex: 1;
    padding-right: 1rem;
}

.item-details h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    color: #2c3e50;
}

.item-details p {
    margin: 0.5rem 0;
    color: #666;
}

.remove-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: #dc3545;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
}

.remove-btn:hover {
    background-color: #c82333;
}

@media (max-width: 600px) {
    .cart-item {
        flex-direction: column;
        align-items: flex-start;
        padding: 1rem;
    }

    .item-image {
        width: 100%;
        margin-right: 0;
        margin-bottom: 1rem;
    }

    .item-image img {
        height: 200px;
    }

    .item-details {
        width: 100%;
        padding-right: 0;
        margin-bottom: 1rem;
    }

    .remove-btn {
        align-self: flex-end;
    }
}
</style>
