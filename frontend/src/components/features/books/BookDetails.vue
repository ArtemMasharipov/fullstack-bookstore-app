<template>
    <div>
        <div v-if="currentBookLoading" class="text-center py-8">
            <loading-spinner />
        </div>

        <!-- A failed load says why, by its error code, and offers to try again -->
        <error-message
            v-else-if="loadError"
            :error="loadError"
            :on-retry="load"
            :closable="false"
            class="mx-auto my-6"
            style="max-width: 800px"
        />

        <v-container v-else-if="book">
            <v-breadcrumbs :items="breadcrumbItems" class="pa-0 mb-4"></v-breadcrumbs>

            <v-row>
                <v-col cols="12" sm="4" md="3">
                    <!-- The largest image of the page: loaded at once, with high priority -->
                    <book-cover
                        :src="book.image"
                        :title="book.title"
                        :author="book.author?.name"
                        priority
                        class="elevation-3"
                    />
                </v-col>

                <v-col cols="12" sm="8" md="9">
                    <h1 class="text-h4 font-weight-bold mb-2">{{ book.title }}</h1>

                    <v-btn
                        v-if="book.author?.id"
                        :to="localeRoute('AuthorDetails', { params: { id: book.author.id } })"
                        variant="text"
                        color="primary"
                        class="px-0 mb-4 text-h6"
                    >
                        {{ book.author.name }}
                    </v-btn>

                    <!-- The year and the category are data; the chips use the text colour, not amber -->
                    <div class="d-flex flex-wrap ga-2 mb-4">
                        <v-chip v-if="book.publicationYear" size="small" variant="tonal" prepend-icon="mdi-calendar">
                            {{ book.publicationYear }}
                        </v-chip>
                        <v-chip v-if="book.category" size="small" variant="tonal" prepend-icon="mdi-tag">
                            {{ book.category }}
                        </v-chip>
                        <v-chip :color="book.inStock ? 'success' : undefined" size="small" variant="tonal">
                            {{ t(book.inStock ? 'catalog.inStock' : 'catalog.outOfStock') }}
                        </v-chip>
                    </div>

                    <div class="book-details__price text-price text-h4 font-weight-bold mb-4">
                        {{ formatPrice(book.price) }}
                    </div>

                    <p v-if="book.description" class="text-body-1 text-medium-emphasis mb-6">
                        {{ book.description }}
                    </p>

                    <!-- Add to cart section -->
                    <div v-if="book.inStock" class="d-flex flex-wrap align-center ga-3 mb-4" style="max-width: 360px">
                        <div class="d-flex align-center">
                            <v-btn
                                icon="mdi-minus"
                                density="comfortable"
                                variant="outlined"
                                size="small"
                                :disabled="quantity <= 1"
                                :aria-label="t('book.decrease')"
                                @click="quantity--"
                            />
                            <span class="text-body-1 font-weight-medium mx-3" aria-live="polite">{{ quantity }}</span>
                            <v-btn
                                icon="mdi-plus"
                                density="comfortable"
                                variant="outlined"
                                size="small"
                                :aria-label="t('book.increase')"
                                @click="quantity++"
                            />
                        </div>

                        <!-- The cart store tells the visitor how adding went, in one notification -->
                        <v-btn
                            size="large"
                            :loading="adding"
                            prepend-icon="mdi-cart-plus"
                            color="primary"
                            class="flex-grow-1"
                            @click="handleAddToCart"
                        >
                            {{ t('catalog.addToCart') }}
                        </v-btn>
                    </div>

                    <v-alert
                        v-else
                        type="warning"
                        variant="tonal"
                        density="compact"
                        class="mb-4"
                        style="max-width: 360px"
                    >
                        {{ t('book.outOfStock') }}
                    </v-alert>

                    <!-- Shipping terms come from the shop settings; without them the page states none -->
                    <div v-if="shop.config" class="d-flex flex-wrap ga-4 mt-2">
                        <div class="d-flex align-center ga-1 text-caption text-medium-emphasis">
                            <v-icon size="16" icon="mdi-truck-delivery-outline" />
                            {{ t('shipping.freeFrom', { amount: formatMoney(shop.config.freeShippingThreshold) }) }}
                        </div>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import { t } from '@/i18n'
import { localeRoute } from '@/router/locale'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useBooksStore, useCartStore, useShopConfigStore } from '@/stores'
import { formatMoney, formatPrice } from '@/utils'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import BookCover from './BookCover.vue'

const props = defineProps({
    bookId: {
        type: String,
        required: true,
    },
})

const booksStore = useBooksStore()
const cartStore = useCartStore()
const shop = useShopConfigStore()

const { currentBook, currentBookLoading } = storeToRefs(booksStore)

const loadError = ref(null)
const quantity = ref(1)
const adding = ref(false)

const book = computed(() => currentBook.value)

const breadcrumbItems = computed(() => [
    { title: t('routes.Books'), to: localeRoute('Books') },
    // The current page: marked active, not disabled, which Vuetify fades below readable contrast
    { title: book.value?.title, disabled: false, active: true },
])

const load = async () => {
    loadError.value = null
    try {
        await booksStore.fetchBookById(props.bookId)
    } catch (error) {
        loadError.value = error
    }
}

const handleAddToCart = async () => {
    if (!book.value.inStock || adding.value) return

    adding.value = true
    try {
        await cartStore.add(book.value.id, quantity.value)
    } finally {
        adding.value = false
    }
}

onMounted(() => {
    load()
    shop.load()
})
</script>
