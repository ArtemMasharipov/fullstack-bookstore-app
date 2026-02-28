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
                            :disabled="localQuantity <= 1"
                            @click="decrement"
                        ></v-btn>

                        <span class="text-body-1 mx-2">{{ localQuantity }}</span>

                        <v-btn
                            icon="mdi-plus"
                            density="compact"
                            variant="outlined"
                            size="small"
                            class="ml-1"
                            @click="increment"
                        ></v-btn>
                    </div>

                    <div class="text-subtitle-1 font-weight-bold mt-3">
                        Total: {{ formatPrice(localQuantity * item.price) }}
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
import placeholderImage from '@/assets/images/placeholder.png'
import { useCartStore } from '@/stores'
import { formatPrice } from '@/utils'
import { debounce } from '@/utils/helpers/debounce'
import { computed, ref, watch } from 'vue'
import ConfirmModal from '../../ui/ConfirmModal.vue'

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
        validator: ({ bookId, book, quantity, price }) =>
            (bookId || book) && Number.isFinite(quantity) && Number.isFinite(price),
    },
})

// Store setup
const cartStore = useCartStore()

// Reactive state
const removing = ref(false)
const showDeleteConfirm = ref(false)
// Local quantity for instant display — synced from store on external changes (rollback, fetchCart)
const localQuantity = ref(props.item.quantity)
watch(
    () => props.item.quantity,
    (val) => {
        localQuantity.value = val
    }
)

// Computed properties
const bookTitle = computed(() => {
    return props.item.bookId?.title ?? props.item.book?.title ?? 'Unknown Book'
})

const bookImage = computed(() => {
    return props.item?.bookId?.image ?? props.item?.book?.image ?? placeholderImage
})

const bookIdForApi = computed(() => {
    const b = props.item.bookId || props.item.book
    return b?._id ?? b?.id
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
        await cartStore.removeFromCart(bookIdForApi.value ?? props.item._id, bookTitle.value)
    } catch (error) {
        // Failed to remove item
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

// Debounced sync to store — batches rapid clicks into one API call
const syncToStore = debounce((quantity) => {
    const id = bookIdForApi.value ?? props.item._id
    cartStore.updateQuantity({ itemId: id, quantity, title: bookTitle.value })
}, 300)

const increment = () => {
    localQuantity.value++
    syncToStore(localQuantity.value)
}

const decrement = () => {
    if (localQuantity.value <= 1) return
    localQuantity.value--
    syncToStore(localQuantity.value)
}
</script>
