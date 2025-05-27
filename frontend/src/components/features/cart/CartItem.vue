<template>
    <v-card variant="outlined" class="mb-4">
        <v-row no-gutters align="center">
            <v-col cols="12" sm="3" md="2">
                <v-img
                    :src="bookImage"
                    :alt="bookTitle"
                    @error="handleImageError"
                    height="160"
                    cover
                    class="rounded-ss-md rounded-es-md"
                ></v-img>
            </v-col>

            <v-col cols="12" sm="7" md="8">
                <v-card-item>
                    <v-card-title>{{ bookTitle }}</v-card-title>
                    <v-card-subtitle class="mt-1"> Price: {{ formatPrice(item.price) }} </v-card-subtitle>

                    <div class="mt-3 d-flex align-center">
                        <span class="text-caption me-2">Quantity:</span>
                        <v-btn
                            icon="mdi-minus"
                            density="compact"
                            variant="outlined"
                            size="small"
                            class="mr-1"
                            :disabled="item.quantity <= 1"
                            @click="updateQuantity(item.quantity - 1)"
                        ></v-btn>

                        <span class="text-body-1 mx-2">{{ item.quantity }}</span>

                        <v-btn
                            icon="mdi-plus"
                            density="compact"
                            variant="outlined"
                            size="small"
                            class="ml-1"
                            @click="updateQuantity(item.quantity + 1)"
                        ></v-btn>
                    </div>

                    <div class="text-subtitle-1 font-weight-bold mt-3">
                        Total: {{ formatPrice(item.quantity * item.price) }}
                    </div>
                </v-card-item>
            </v-col>

            <v-col cols="12" sm="2" md="2" class="d-flex align-center justify-end pr-4">
                <v-btn
                    color="error"
                    variant="text"
                    icon="mdi-delete"
                    size="small"
                    @click="confirmRemove"
                    :loading="removing"
                ></v-btn>
            </v-col>
        </v-row>

        <confirm-modal
            v-model="showDeleteConfirm"
            title="Remove Item"
            :message="`Are you sure you want to remove '${bookTitle}' from your cart?`"
            confirm-text="Remove"
            @confirm="remove"
        />
    </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import placeholderImage from '@/assets/images/placeholder.png'
import { toast, useCartStore } from '@/store'
import { debounce } from 'lodash'
import ConfirmModal from '../../ui/ConfirmModal.vue'
import { formatPrice } from '@/utils'

/**
 * Cart item component for displaying a single cart item
 */

// Props
const props = defineProps({
    /**
     * Cart item object with book details, quantity and price
     */
    item: {
        type: Object,
        required: true,
        validator: ({ bookId, quantity, price }) => bookId && Number.isFinite(quantity) && Number.isFinite(price),
    },
})

// Emits
const emit = defineEmits(['error', 'update-quantity'])

// Store setup
const cartStore = useCartStore()

// Reactive state
const removing = ref(false)
const showDeleteConfirm = ref(false)

// Computed properties
const bookTitle = computed(() => {
    const { title = 'Unknown Book' } = props.item.bookId || {}
    return title
})

const bookImage = computed(() => {
    return props.item?.bookId?.image || placeholderImage
})

const formattedPrice = computed(() => {
    return formatPrice(props.item.price)
})

// Methods
/**
 * Show confirmation dialog before removing item
 */
const confirmRemove = () => {
    showDeleteConfirm.value = true
}

/**
 * Remove item from cart
 */
const remove = async () => {
    if (removing.value) return

    removing.value = true
    try {
        await cartStore.removeFromCart(props.item._id, bookTitle.value)
        // После удаления элемента обновляем счетчик корзины
        await cartStore.fetchCart()
    } catch (error) {
        toast.error(`Failed to remove ${bookTitle.value}: ${error.message}`)
    } finally {
        removing.value = false
    }
}

/**
 * Handle image loading errors
 */
const handleImageError = (e) => {
    e.target.src = placeholderImage
}

/**
 * Handle quantity in cart (debounced)
 */
const handleQuantityChange = (quantity) => {
    if (quantity < 1) return

    emit('update-quantity', {
        bookId: props.item.bookId._id,
        quantity,
        title: bookTitle.value,
    })

    cartStore
        .updateQuantity({
            itemId: props.item._id,
            bookId: props.item.bookId._id,
            quantity,
            title: bookTitle.value,
        })
        .then(() => {
            // После обновления количества обновляем счетчик корзины
            return cartStore.fetchCart()
        })
        .catch((error) => {
            toast.error(`Failed to update quantity: ${error.message}`)
        })
}

// Debounced update quantity function
let updateQuantity

// Lifecycle
onMounted(() => {
    // Initialize debounced quantity update function
    updateQuantity = debounce(handleQuantityChange, 300)
})
</script>
