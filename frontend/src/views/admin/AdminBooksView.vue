<template>
    <div>
        <admin-table
            :headers="headers"
            :items="items"
            :items-length="total"
            :loading="loading"
            :error="error"
            :page="state.page"
            :limit="state.limit"
            :sort-by="state.sortBy"
            :empty-text="t(filtered ? 'admin.books.noResults' : 'admin.books.empty')"
            :filtered="filtered"
            @update:page="update({ page: $event })"
            @update:limit="update({ limit: $event })"
            @update:sort-by="update({ sortBy: $event ?? LIST.defaultSort })"
            @retry="reload"
            @reset-filters="update({ q: '', filters: {} })"
        >
            <template #toolbar>
                <div class="admin-books__toolbar">
                    <v-text-field
                        v-model="search"
                        type="search"
                        :label="t('admin.books.search')"
                        prepend-inner-icon="mdi-magnify"
                        maxlength="100"
                        hide-details
                        clearable
                    />
                    <v-select
                        :model-value="state.filters.category ?? ''"
                        :items="categoryOptions"
                        :label="t('admin.books.category')"
                        :open-text="t('admin.books.category')"
                        :close-text="t('admin.books.category')"
                        hide-details
                        @update:model-value="setFilter('category', $event)"
                    />
                    <v-select
                        :model-value="state.filters.inStock ?? ''"
                        :items="stockOptions"
                        :label="t('admin.books.availability')"
                        :open-text="t('admin.books.availability')"
                        :close-text="t('admin.books.availability')"
                        hide-details
                        @update:model-value="setFilter('inStock', $event)"
                    />
                    <v-btn prepend-icon="mdi-plus" class="admin-books__add" @click="openForm(null)">
                        {{ t('admin.books.add') }}
                    </v-btn>
                </div>
            </template>

            <template #item.cover="{ item }">
                <book-cover :src="item.image" :title="item.title" class="admin-books__cover" />
            </template>
            <template #item.author="{ item }">
                {{ item.author ? `${item.author.firstName} ${item.author.lastName}` : t('common.notAvailable') }}
            </template>
            <template #item.price="{ item }">{{ formatPrice(item.price) }}</template>
            <template #item.inStock="{ item }">
                <v-switch
                    :model-value="item.inStock"
                    :aria-label="t('admin.books.stockToggle', { title: item.title })"
                    :disabled="stockChanging.includes(item.id)"
                    color="primary"
                    density="compact"
                    inset
                    hide-details
                    @update:model-value="setStock(item, $event)"
                />
            </template>
            <template #item.actions="{ item }">
                <div class="d-flex justify-end">
                    <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        size="small"
                        :aria-label="t('admin.books.edit', { title: item.title })"
                        @click="openForm(item)"
                    />
                    <v-btn
                        icon="mdi-delete"
                        variant="text"
                        size="small"
                        color="error"
                        :aria-label="t('admin.books.delete', { title: item.title })"
                        @click="askDelete(item)"
                    />
                </div>
            </template>
            <template #empty-action>
                <v-btn prepend-icon="mdi-plus" @click="openForm(null)">{{ t('admin.books.add') }}</v-btn>
            </template>
        </admin-table>

        <book-form-dialog v-model="formOpen" :book="editedBook" @saved="onSaved" />

        <confirm-modal
            v-model="deleteOpen"
            :title="t('admin.books.deleteTitle')"
            :message="t('admin.books.deleteMessage', { title: bookToDelete?.title ?? '' })"
            :confirm-text="t('admin.books.deleteConfirm')"
            @confirm="deleteBook"
        />
    </div>
</template>

<script setup>
import AdminTable from '@/components/features/admin/AdminTable.vue'
import BookFormDialog from '@/components/features/admin/BookFormDialog.vue'
import BookCover from '@/components/features/books/BookCover.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useAdminList } from '@/composables/useAdminList'
import { useNotifications } from '@/composables/useNotifications'
import { useReturnFocus } from '@/composables/useReturnFocus'
import { t } from '@/i18n'
import { booksApi } from '@/services/api/booksApi'
import { formatPrice } from '@/utils'
import { BOOK_CATEGORIES } from '@/utils/constants/app'
import { resolveErrorKey } from '@/utils/errorResolver'
import { debounce } from '@/utils/helpers/debounce'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

/**
 * The admin's books: a page of GET /books with its search, filters, sort and page in the address; the stock is
 * switched in the row; a book is added and edited in the form dialog and deleted after a confirmation. Each action
 * ends in one notification.
 */

const LIST = {
    sorts: ['-createdAt', 'title', '-title', 'price', '-price', 'publicationYear', '-publicationYear'],
    defaultSort: '-createdAt',
    filters: {
        category: (value) => BOOK_CATEGORIES.includes(value),
        inStock: (value) => value === 'true' || value === 'false',
    },
}

const { state, items, total, loading, error, update, reload } = useAdminList({
    config: LIST,
    load: (params) => booksApi.fetchAll(params),
})
const { showSuccess, showError } = useNotifications()

const headers = computed(() => [
    { title: t('admin.books.columns.cover'), key: 'cover', sortable: false, width: 72 },
    { title: t('admin.books.columns.title'), key: 'title', sortable: true },
    { title: t('admin.books.columns.author'), key: 'author', sortable: false },
    { title: t('admin.books.columns.category'), key: 'category', sortable: false },
    { title: t('admin.books.columns.year'), key: 'publicationYear', sortable: true },
    { title: t('admin.books.columns.price'), key: 'price', sortable: true, align: 'end' },
    { title: t('admin.books.columns.inStock'), key: 'inStock', sortable: false },
    { title: t('admin.books.columns.actions'), key: 'actions', sortable: false, align: 'end' },
])

const categoryOptions = computed(() => [
    { value: '', title: t('admin.books.all') },
    ...BOOK_CATEGORIES.map((category) => ({ value: category, title: category })),
])
const stockOptions = computed(() => [
    { value: '', title: t('admin.books.all') },
    { value: 'true', title: t('catalog.inStock') },
    { value: 'false', title: t('catalog.outOfStock') },
])

const filtered = computed(() => Boolean(state.value.q || Object.keys(state.value.filters).length))
const setFilter = (name, value) => update({ filters: { ...state.value.filters, [name]: value ?? '' } })

// The search goes to the address once typing pauses; Back and a link bring their own search into the field
const search = ref(state.value.q)
const sendSearch = debounce((value) => update({ q: (value ?? '').trim() }), 300)
const route = useRoute()
const ownRoute = route.name
watch(
    () => route.name,
    (name) => {
        if (name !== ownRoute) sendSearch.cancel()
    }
)
onBeforeUnmount(() => sendSearch.cancel())
onBeforeRouteLeave(() => {
    sendSearch.cancel()
})
watch(search, (value) => {
    sendSearch.cancel()
    if ((value ?? '').trim() !== state.value.q) sendSearch(value)
})
watch(
    () => state.value.q,
    (q) => {
        sendSearch.cancel()
        if ((search.value ?? '').trim() !== q) search.value = q
    }
)

// The stock switch of a row: shown at once, put back when the API refuses it
const stockChanging = ref([])
async function setStock(book, inStock) {
    const before = book.inStock
    book.inStock = inStock
    stockChanging.value.push(book.id)
    try {
        const { data } = await booksApi.setStock(book.id, inStock)
        book.inStock = data.inStock
        showSuccess(undefined, {
            messageKey: data.inStock ? 'admin.books.nowInStock' : 'admin.books.nowOutOfStock',
            messageParams: { title: book.title },
        })
    } catch (failure) {
        book.inStock = before
        showError(undefined, { messageKey: resolveErrorKey(failure) })
    } finally {
        stockChanging.value = stockChanging.value.filter((id) => id !== book.id)
    }
}

const formOpen = ref(false)
const editedBook = ref(null)
function openForm(book) {
    editedBook.value = book
    formOpen.value = true
}
function onSaved(book, created) {
    showSuccess(undefined, {
        messageKey: created ? 'admin.books.created' : 'admin.books.updated',
        messageParams: { title: book.title },
    })
    reload()
}

const deleteOpen = ref(false)
const bookToDelete = ref(null)
const deleteFocus = useReturnFocus()
function askDelete(book) {
    deleteFocus.remember()
    bookToDelete.value = book
    deleteOpen.value = true
}
watch(deleteOpen, async (open) => {
    if (open) return
    await nextTick()
    deleteFocus.restore()
})
async function deleteBook() {
    const book = bookToDelete.value
    try {
        await booksApi.delete(book.id)
        showSuccess(undefined, { messageKey: 'admin.books.deleted', messageParams: { title: book.title } })
        await reload()
    } catch (failure) {
        showError(undefined, { messageKey: resolveErrorKey(failure) })
    }
}
</script>

<style scoped>
.admin-books__toolbar {
    display: grid;
    grid-template-columns: minmax(14rem, 2fr) repeat(2, minmax(10rem, 1fr)) auto;
    gap: 12px;
    align-items: center;
}

@media (max-width: 959px) {
    .admin-books__toolbar {
        grid-template-columns: 1fr;
    }

    .admin-books__add {
        justify-self: start;
    }
}

.admin-books__cover {
    width: 40px;
    margin: 4px 0;
}
</style>
