<template>
    <v-card class="book-card" height="100%">
        <book-cover :src="book.image" :title="book.title" :author="book.author?.name" :eager="eager" />

        <div class="book-card__body">
            <!-- Category names are catalogue data, as in the books themselves -->
            <p v-if="eyebrow" class="book-card__eyebrow text-medium-emphasis">{{ eyebrow }}</p>

            <!-- The title links to the book; the link stretches over the whole card -->
            <component :is="`h${headingLevel}`" class="book-card__title">
                <router-link
                    :to="localeRoute('BookDetails', { params: { id: book.id } })"
                    :title="book.title"
                    class="book-card__link"
                >
                    {{ book.title }}
                </router-link>
            </component>

            <p v-if="book.author?.name" class="book-card__author text-medium-emphasis">{{ book.author.name }}</p>

            <div class="book-card__meta">
                <span class="book-card__price text-price">{{ formatPrice(book.price) }}</span>
                <v-chip :color="book.inStock ? 'success' : undefined" size="small" variant="tonal">
                    {{ t(book.inStock ? 'catalog.inStock' : 'catalog.outOfStock') }}
                </v-chip>
            </div>

            <!-- The visible label leads the name, so voice control finds the button by what it shows -->
            <v-btn
                v-if="book.inStock"
                class="book-card__add"
                color="primary"
                block
                prepend-icon="mdi-cart-plus"
                :aria-label="t('catalog.addToCartNamed', { title: book.title })"
                :loading="adding"
                :disabled="adding"
                @click="addToCart"
            >
                {{ t('catalog.addToCart') }}
            </v-btn>
        </div>
    </v-card>
</template>

<script setup>
import { t } from '@/i18n'
import { localeRoute } from '@/router/locale'
import { useCartStore } from '@/stores'
import { formatPrice } from '@/utils'
import { computed, ref } from 'vue'
import BookCover from './BookCover.vue'

/**
 * A book in a list: the title links to the book page, the add-to-cart button is a separate control named after
 * the book. A book out of stock has no button.
 */
const props = defineProps({
    // A book as normalizeBook returns it
    book: {
        type: Object,
        required: true,
    },
    // The level of the title heading under the page's own headings
    headingLevel: {
        type: Number,
        default: 2,
    },
    // Loads the cover at once: cards in the first screen
    eager: Boolean,
})

const cartStore = useCartStore()
const adding = ref(false)

const eyebrow = computed(() => [props.book.category, props.book.publicationYear].filter(Boolean).join(' · '))

// The store tells the visitor how adding went, in one notification
const addToCart = async () => {
    adding.value = true
    try {
        await cartStore.add(props.book.id, 1)
    } finally {
        adding.value = false
    }
}
</script>

<style scoped>
.book-card {
    position: relative;
    display: flex;
    flex-direction: column;
    transition: transform 200ms ease, box-shadow 200ms ease;
}

.book-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg, 0 8px 24px rgba(27, 42, 74, 0.12)) !important;
}

@media (prefers-reduced-motion: reduce) {
    .book-card,
    .book-card:hover {
        transition: none;
        transform: none;
    }
}

.book-card__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px 16px;
}

.book-card__eyebrow {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.book-card__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.3;
}

/* Two lines at most; the whole title is in the link's title attribute */
.book-card__link {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    overflow-wrap: anywhere;
}

.book-card__link:hover {
    text-decoration: underline;
}

/* The link covers the card, so a click anywhere but the button opens the book */
.book-card__link::after {
    content: '';
    position: absolute;
    inset: 0;
}

.book-card__author {
    margin: 0;
    font-size: 0.875rem;
}

.book-card__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: auto;
    padding-top: 8px;
}

.book-card__price {
    font-size: 1.125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

/* Above the stretched link. A block button grows with Vuetify's flex: 1 0 auto; in this column it would take the
   card's free height, so the free space goes to the price row's top margin and the cards of a row line up */
.book-card__add {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    margin-top: 8px;
}
</style>
