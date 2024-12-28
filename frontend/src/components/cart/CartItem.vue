<template>
    <div class="cart-item">
        <div class="item-info">
            <h3>{{ item.title }}</h3>
            <p>{{ item.author.name }}</p>
            <p>Price: ${{ item.price }}</p>
        </div>
        <div class="item-actions">
            <input v-model.number="quantity" type="number" min="1" @change="updateQuantity" />
            <button @click="removeItem">Remove</button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CartItem',
    props: {
        item: {
            type: Object,
            required: true,
        },
    },
    emits: ['update-quantity', 'remove'],
    data() {
        return {
            quantity: this.item.quantity,
        }
    },
    methods: {
        updateQuantity() {
            this.$emit('update-quantity', { id: this.item.id, quantity: this.quantity })
        },
        removeItem() {
            this.$emit('remove', this.item.id)
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

.item-info {
    flex: 1;
}

.item-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

input[type='number'] {
    width: 60px;
    padding: 0.5rem;
    border: 1px solid var(--gray-medium);
    border-radius: 4px;
}

button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: var(--error-color);
    color: var(--white);
    cursor: pointer;
}
</style>
