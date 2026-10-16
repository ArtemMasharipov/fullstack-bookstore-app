<template>
    <div>
        <!-- Hero Section -->
        <v-sheet class="hero-section py-16 text-center" color="primary">
            <v-container>
                <v-row justify="center">
                    <v-col cols="12" md="8" lg="6">
                        <h1 class="text-h3 text-md-h2 font-weight-bold text-white mb-4">{{ t('home.hero.title') }}</h1>
                        <p class="text-body-1 text-white mb-8" style="opacity: 0.85">{{ t('home.hero.text') }}</p>
                        <v-btn
                            color="secondary"
                            size="x-large"
                            class="hero-cta"
                            :to="localeRoute('Books')"
                            prepend-icon="mdi-book-open-page-variant-outline"
                            elevation="3"
                        >
                            {{ t('home.hero.browse') }}
                        </v-btn>
                    </v-col>
                </v-row>
            </v-container>
        </v-sheet>

        <!-- Categories Section -->
        <v-container class="py-10">
            <h2 class="text-h5 font-weight-bold text-center mb-6">{{ t('home.categories') }}</h2>
            <div class="d-flex flex-wrap justify-center ga-2">
                <!-- Category names are catalogue data, as in the books themselves -->
                <v-chip
                    v-for="category in featuredCategories"
                    :key="category.name"
                    :to="localeRoute('Books', { query: { category: category.name } })"
                    :prepend-icon="category.icon"
                    size="large"
                    variant="outlined"
                    color="primary"
                    class="category-chip"
                >
                    {{ category.name }}
                </v-chip>
            </div>
        </v-container>

        <v-divider />

        <!-- Featured Books Section -->
        <v-container class="py-10">
            <div class="d-flex align-center justify-space-between mb-6">
                <h2 class="text-h5 font-weight-bold">{{ t('home.latest') }}</h2>
                <v-btn variant="text" :to="localeRoute('Books')" append-icon="mdi-arrow-right">
                    {{ t('home.viewAll') }}
                </v-btn>
            </div>

            <v-skeleton-loader v-if="loading" type="card-avatar, card-avatar, card-avatar, card-avatar" />

            <v-row v-else-if="featuredBooks.length">
                <v-col
                    v-for="book in featuredBooks"
                    :key="book.id ?? book._id"
                    cols="12"
                    sm="6"
                    md="3"
                    class="d-flex align-stretch"
                >
                    <book-card
                        :book="book"
                        class="w-100"
                        @click="router.push(localeRoute('BookDetails', { params: { id: book.id ?? book._id } }))"
                    />
                </v-col>
            </v-row>

            <v-alert v-else type="info" variant="tonal" icon="mdi-bookshelf" class="text-center">
                {{ t('home.empty') }}
            </v-alert>
        </v-container>

        <!-- Shop terms: stated only from the shop's own settings, so nothing shows until they load -->
        <template v-if="shop.config">
            <v-divider />

            <v-container tag="section" class="home-terms py-10" aria-labelledby="home-terms-title">
                <h2 id="home-terms-title" class="d-sr-only">{{ t('home.terms.title') }}</h2>
                <v-row justify="center">
                    <v-col v-for="item in terms" :key="item.title" cols="12" sm="4" class="text-center">
                        <v-icon :icon="item.icon" size="48" color="secondary" class="mb-3" />
                        <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ item.title }}</h3>
                        <p class="text-body-2 text-medium-emphasis">{{ item.text }}</p>
                    </v-col>
                </v-row>
            </v-container>
        </template>
    </div>
</template>

<script setup>
import BookCard from '@/components/features/books/BookCard.vue'
import { localeRoute } from '@/router/locale'
import { useBooksStore, useShopConfigStore } from '@/stores'
import { formatMoney } from '@/utils'
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const booksStore = useBooksStore()
const shop = useShopConfigStore()
const { books, loading } = storeToRefs(booksStore)

const featuredBooks = computed(() => books.value.slice(0, 4))

const featuredCategories = [
    { name: 'Fiction', icon: 'mdi-book-open-variant' },
    { name: 'Science Fiction', icon: 'mdi-rocket-launch-outline' },
    { name: 'Fantasy', icon: 'mdi-creation-outline' },
    { name: 'Mystery', icon: 'mdi-magnify' },
    { name: 'Biography', icon: 'mdi-account-outline' },
    { name: 'History', icon: 'mdi-clock-outline' },
    { name: 'Science', icon: 'mdi-flask-outline' },
    { name: 'Technology', icon: 'mdi-laptop' },
]

// Only what the shop does: delivery and VAT from its settings, and the order history it has
const terms = computed(() => {
    const config = shop.config
    return [
        {
            icon: 'mdi-truck-delivery-outline',
            title: t('home.terms.delivery.title'),
            text: t('home.terms.delivery.text', {
                fee: formatMoney(config.shippingFee),
                threshold: formatMoney(config.freeShippingThreshold),
            }),
        },
        config.vatIncluded && {
            icon: 'mdi-receipt-text-outline',
            title: t('home.terms.vat.title'),
            text: t('home.terms.vat.text'),
        },
        {
            icon: 'mdi-package-variant-closed',
            title: t('home.terms.orders.title'),
            text: t('home.terms.orders.text'),
        },
    ].filter(Boolean)
})

onMounted(() => {
    booksStore.limit = 4
    booksStore.loadBooks()
    shop.load()
})
</script>

<style scoped>
.hero-section {
    background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #2a4470 100%);
}

/* White on the secondary color is 2.2:1; the navy of the light theme gives 6.4:1. The hero and its button look
   the same in both themes, so the color is fixed rather than the theme's primary, which is lighter in the dark theme */
.hero-cta.v-btn {
    color: #1b2a4a !important;
}

.category-chip {
    transition: transform var(--motion-fast) var(--motion-ease);
}

.category-chip:hover {
    transform: translateY(-2px);
}
</style>
