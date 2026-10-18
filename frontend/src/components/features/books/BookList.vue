<template>
    <section class="catalog" aria-labelledby="catalog-title">
        <header class="catalog-header">
            <!-- Focus lands here after paging, so keyboard and screen reader users go on from the top of the page -->
            <h1 id="catalog-title" ref="heading" class="catalog-title text-h4" tabindex="-1">
                {{ t('catalog.title') }}
            </h1>
            <!-- The line keeps its height while the books load, so the search and the categories do not move -->
            <p class="catalog-range text-medium-emphasis">
                {{ showRange ? t('catalog.range', range) : '' }}
            </p>
        </header>

        <v-text-field
            v-model="search"
            class="catalog-search"
            :label="t('catalog.search.label')"
            :aria-label="t('catalog.search.label')"
            :hint="searchHint"
            :persistent-hint="Boolean(searchHint)"
            :loading="loading"
            prepend-inner-icon="mdi-magnify"
            clearable
            @update:model-value="onSearch"
        />

        <div class="catalog-categories" role="group" :aria-label="t('catalog.categories.label')">
            <!-- Category names are catalogue data, as in the books themselves -->
            <v-btn
                v-for="option in categoryOptions"
                :key="option.value"
                size="small"
                :variant="option.value === query.category ? 'flat' : 'outlined'"
                :color="option.value === query.category ? 'primary' : undefined"
                :aria-pressed="String(option.value === query.category)"
                @click="chooseCategory(option.value)"
            >
                {{ option.label }}
            </v-btn>
        </div>

        <error-message v-if="error" :error="error" :on-retry="load" :closable="false" class="my-4" />

        <v-row v-else-if="loading" tag="ul" class="book-grid">
            <v-col v-for="n in CATALOG_PAGE_SIZE" :key="n" tag="li" cols="12" sm="6" md="4" lg="3" class="d-flex">
                <book-card-skeleton />
            </v-col>
        </v-row>

        <v-alert v-else-if="!books.length" type="info" variant="tonal" class="my-4">
            <template v-if="filtered">
                <p>{{ t('catalog.noResults') }}</p>
                <v-btn variant="text" class="mt-2" :to="localeRoute('Books')">{{ t('catalog.resetFilters') }}</v-btn>
            </template>
            <p v-else>{{ t('catalog.empty') }}</p>
        </v-alert>

        <v-row v-else tag="ul" class="book-grid">
            <v-col v-for="(book, index) in books" :key="book.id" tag="li" cols="12" sm="6" md="4" lg="3" class="d-flex">
                <book-card :book="book" :heading-level="2" :eager="index < 4" class="w-100" />
            </v-col>
        </v-row>

        <v-pagination
            v-if="!error && pages > 1"
            :model-value="query.page"
            :length="pages"
            :total-visible="mobile ? 5 : 7"
            class="my-6"
            @update:model-value="goToPage"
        />
    </section>
</template>

<script setup>
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { t } from '@/i18n'
import {
    CATALOG_PAGE_SIZE,
    canonicalCatalogQuery,
    catalogQuery,
    parseCatalogQuery,
    toBooksParams,
} from '@/router/catalogQuery'
import { localeRoute } from '@/router/locale'
import { useBooksStore } from '@/stores'
import { BOOK_CATEGORIES } from '@/utils/constants/app'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import BookCard from './BookCard.vue'
import BookCardSkeleton from './BookCardSkeleton.vue'

/**
 * The catalogue. Its address is the only source of what it shows: the page, the search and the category come from
 * the URL, and every change of the list changes the URL first (paging and categories add a history entry, typing
 * replaces it). Back, Forward, a reload and a shared link therefore show the same books.
 */

const SEARCH_DELAY = 300

const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()
const booksStore = useBooksStore()
const { books, loading, error, page, limit, total, pages } = storeToRefs(booksStore)

const heading = ref(null)
const query = computed(() => parseCatalogQuery(route.query))
const filtered = computed(() => Boolean(query.value.q || query.value.category))

const showRange = computed(() => !loading.value && !error.value && total.value > 0 && books.value.length > 0)
const range = computed(() => {
    const from = (page.value - 1) * limit.value + 1
    return { from, to: from + books.value.length - 1, total: total.value }
})

const categoryOptions = computed(() => [
    { value: '', label: t('catalog.categories.all') },
    ...BOOK_CATEGORIES.map((category) => ({ value: category, label: category })),
])

// Opens a catalogue state: a new page or category is a step in the history, a search replaces the current one
const open = (state, { replace = false } = {}) => {
    const target = { query: catalogQuery({ ...query.value, ...state }) }
    return replace ? router.replace(target) : router.push(target)
}

const load = async () => {
    const at = route.fullPath
    const params = toBooksParams(query.value)
    let response
    try {
        response = await booksStore.fetchBooks(params)
    } catch {
        // The store keeps the error of the latest request, and the page shows it with Try again
        return
    }
    // A page past the end of the list (an old link) opens the last page, if the visitor is still on it
    const { total: found, pages: last } = response.pagination
    if (route.fullPath === at && found > 0 && params.page > last) open({ page: last }, { replace: true })
}

watch(
    () => route.query,
    (value) => {
        // Leaving the catalogue changes the route before this component goes away
        if (route.name !== 'Books') return
        const canonical = canonicalCatalogQuery(value)
        if (canonical) router.replace({ query: canonical })
        else load()
    },
    { immediate: true }
)

const goToPage = async (next) => {
    await open({ page: next })
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    heading.value?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    heading.value?.focus({ preventScroll: true })
}

const chooseCategory = (category) => open({ page: 1, category })

// The search field shows the address's search, also after Back or Forward
const search = ref(query.value.q)
watch(
    () => query.value.q,
    (q) => {
        if ((search.value ?? '').trim() !== q) search.value = q
    }
)

const searchHint = computed(() => ((search.value ?? '').trim().length === 1 ? t('catalog.search.hint') : ''))

let searchTimer
const onSearch = (value) => {
    clearTimeout(searchTimer)
    const text = (value ?? '').trim()
    // One character is not a search yet: the hint asks for two, the list stays
    if (text.length === 1) return
    searchTimer = setTimeout(() => open({ page: 1, q: text }, { replace: true }), SEARCH_DELAY)
}

onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<style scoped>
.catalog-header {
    margin-bottom: 16px;
}

.catalog-title {
    margin-bottom: 4px;
}

.catalog-title:focus {
    outline: none;
}

.catalog-range {
    min-height: 1.5em;
    margin: 0;
    line-height: 1.5;
}

.catalog-search {
    max-width: 480px;
}

.catalog-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 16px;
}

.book-grid {
    margin-top: 0;
    padding: 0;
    list-style: none;
}
</style>
