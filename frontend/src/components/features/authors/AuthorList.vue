<template>
    <section class="authors" aria-labelledby="authors-title">
        <header class="authors-header">
            <!-- Focus lands here after paging, so keyboard and screen reader users go on from the top of the page -->
            <h1 id="authors-title" ref="heading" class="authors-title text-h4" tabindex="-1">
                {{ t('authors.title') }}
            </h1>
            <!-- The line keeps its height while the authors load. It tells screen reader users what a search found,
                 focus staying put; it is a live region without role="status", which the error's Contact uses -->
            <p class="authors-range text-medium-emphasis" aria-live="polite" aria-atomic="true">
                {{ showRange ? t('authors.range', range) : '' }}
            </p>
        </header>

        <!-- Details only for the hint: their box is an alert of its own, and an error must stay the only one -->
        <v-text-field
            v-model="search"
            class="authors-search"
            :label="t('authors.search.label')"
            :aria-label="t('authors.search.label')"
            :hint="searchHint"
            :persistent-hint="Boolean(searchHint)"
            hide-details="auto"
            :maxlength="MAX_SEARCH"
            :loading="loading"
            prepend-inner-icon="mdi-magnify"
            clearable
            @update:model-value="onSearch"
        />

        <error-message v-if="error" :error="error" :on-retry="load" :closable="false" class="my-4" />

        <div v-else-if="loading" class="py-8">
            <loading-spinner />
        </div>

        <v-alert v-else-if="!authors.length" type="info" variant="tonal" class="my-4">
            <template v-if="query.q">
                <p>{{ t('authors.noResults') }}</p>
                <v-btn variant="text" class="mt-2" :to="localeRoute('Authors')">{{ t('authors.clearSearch') }}</v-btn>
            </template>
            <p v-else>{{ t('authors.empty') }}</p>
        </v-alert>

        <v-row v-else tag="ul" class="author-grid">
            <v-col v-for="author in authors" :key="author.id" tag="li" cols="12" sm="6" md="4">
                <author-list-item :author="author" />
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
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { t } from '@/i18n'
import {
    MAX_SEARCH,
    authorsQuery,
    canonicalAuthorsQuery,
    parseAuthorsQuery,
    toAuthorsParams,
} from '@/router/authorsQuery'
import { localeRoute } from '@/router/locale'
import { useAuthorsStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import AuthorListItem from './AuthorListItem.vue'

/**
 * The public author list. As in the catalogue (BookList.vue), its address is the only source of what it shows: the
 * page and the search come from the URL (router/authorsQuery.js), and the server searches and pages. Paging adds a
 * history entry, typing replaces it.
 */

const SEARCH_DELAY = 300

const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()
const authorsStore = useAuthorsStore()
const { list: authors, loading, error, page, limit, total, pages } = storeToRefs(authorsStore)

const heading = ref(null)
const query = computed(() => parseAuthorsQuery(route.query))

const showRange = computed(() => !loading.value && !error.value && total.value > 0 && authors.value.length > 0)
const range = computed(() => {
    const from = (page.value - 1) * limit.value + 1
    return { from, to: from + authors.value.length - 1, total: total.value }
})

// Opens a list state: a new page is a step in the history, a search replaces the current one
const open = (state, { replace = false } = {}) => {
    const target = { query: authorsQuery({ ...query.value, ...state }) }
    return replace ? router.replace(target) : router.push(target)
}

const load = async () => {
    const at = route.fullPath
    const params = toAuthorsParams(query.value)
    let response
    try {
        response = await authorsStore.fetchAuthors(params)
    } catch {
        // The store keeps the error of the latest request, and the page shows it with Retry
        return
    }
    // A page past the end of the list (an old link) opens the last page, if the visitor is still on it
    const { total: found, pages: last } = response.pagination
    if (route.fullPath === at && found > 0 && params.page > last) open({ page: last }, { replace: true })
}

watch(
    () => route.query,
    (value) => {
        // Leaving the list changes the route before this component goes away
        if (route.name !== 'Authors') return
        const canonical = canonicalAuthorsQuery(value)
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

// The search field shows the address's search, also after Back or Forward
const search = ref(query.value.q)
watch(
    () => query.value.q,
    (q) => {
        if ((search.value ?? '').trim() !== q) search.value = q
    }
)

const searchHint = computed(() => ((search.value ?? '').trim().length === 1 ? t('authors.search.hint') : ''))

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
.authors-header {
    margin-bottom: 16px;
}

.authors-title {
    margin-bottom: 4px;
}

.authors-title:focus {
    outline: none;
}

.authors-range {
    min-height: 1.5em;
    margin: 0;
    line-height: 1.5;
}

.authors-search {
    max-width: 480px;
}

.author-grid {
    margin-top: 8px;
    padding: 0;
    list-style: none;
}
</style>
