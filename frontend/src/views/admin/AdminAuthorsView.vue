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
            :filtered="filtered"
            :empty-text="t(filtered ? 'admin.authors.noResults' : 'admin.authors.empty')"
            @update:page="update({ page: $event })"
            @update:limit="update({ limit: $event })"
            @update:sort-by="update({ sortBy: $event ?? LIST.defaultSort })"
            @retry="reload"
            @reset-filters="update({ q: '', filters: {} })"
        >
            <template #toolbar>
                <div class="admin-authors__toolbar">
                    <v-text-field
                        v-model="search"
                        :label="t('admin.authors.search')"
                        type="search"
                        maxlength="100"
                        prepend-inner-icon="mdi-magnify"
                        clearable
                        hide-details
                    />
                    <v-select
                        :model-value="state.sortBy"
                        :items="sortOptions"
                        :label="t('admin.authors.sort')"
                        :open-text="t('admin.authors.sort')"
                        :close-text="t('admin.authors.sort')"
                        hide-details
                        @update:model-value="update({ sortBy: $event })"
                    />
                    <v-btn ref="addButton" class="admin-authors__add" prepend-icon="mdi-plus" @click="openForm(null)">
                        {{ t('admin.authors.add') }}
                    </v-btn>
                </div>
            </template>
            <template #item.lastName="{ item }">{{ nameOf(item) }}</template>
            <template #item.country="{ item }">{{ item.country || t('common.notAvailable') }}</template>
            <template #item.birthYear="{ item }">{{ item.birthYear ?? t('common.notAvailable') }}</template>
            <template #item.actions="{ item }">
                <div class="d-flex justify-end">
                    <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        size="small"
                        :aria-label="t('admin.authors.edit', { name: nameOf(item) })"
                        @click="openForm(item)"
                    />
                    <v-btn
                        icon="mdi-delete"
                        variant="text"
                        size="small"
                        color="error"
                        :disabled="deleting"
                        :aria-label="t('admin.authors.delete', { name: nameOf(item) })"
                        @click="askDelete(item)"
                    />
                </div>
            </template>
            <template #empty-action>
                <v-btn prepend-icon="mdi-plus" @click="openForm(null)">{{ t('admin.authors.add') }}</v-btn>
            </template>
        </admin-table>
        <author-form-dialog v-model="formOpen" :author="editedAuthor" @saved="onSaved" />
        <confirm-modal
            v-model="deleteOpen"
            :title="t('admin.authors.deleteTitle')"
            :message="t('admin.authors.deleteMessage', { name: authorToDelete ? nameOf(authorToDelete) : '' })"
            :confirm-text="t('admin.authors.deleteConfirm')"
            @confirm="deleteAuthor"
        />
    </div>
</template>

<script setup>
import AdminTable from '@/components/features/admin/AdminTable.vue'
import AuthorFormDialog from '@/components/features/admin/AuthorFormDialog.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useAdminList } from '@/composables/useAdminList'
import { useNotifications } from '@/composables/useNotifications'
import { useReturnFocus } from '@/composables/useReturnFocus'
import { t } from '@/i18n'
import { authorsApi } from '@/services/api/authorsApi'
import { resolveErrorKey } from '@/utils/errorResolver'
import { debounce } from '@/utils/helpers/debounce'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const LIST = {
    sorts: ['-createdAt', 'createdAt', 'firstName', '-firstName', 'lastName', '-lastName', 'birthYear', '-birthYear'],
    defaultSort: '-createdAt',
    filters: {},
}
const { state, items, total, loading, error, update, reload } = useAdminList({
    config: LIST,
    load: (params) => authorsApi.fetchAll(params),
})
const { showSuccess, showError } = useNotifications()
const filtered = computed(() => Boolean(state.value.q))
const nameOf = (author) => `${author.firstName} ${author.lastName}`
const headers = computed(() => [
    { key: 'lastName', title: t('admin.authors.columns.name'), sortable: true },
    { key: 'country', title: t('admin.authors.columns.country'), sortable: false },
    { key: 'birthYear', title: t('admin.authors.columns.birthYear'), sortable: true },
    { key: 'booksCount', title: t('admin.authors.columns.booksCount'), sortable: false },
    { key: 'actions', title: t('admin.authors.columns.actions'), sortable: false, align: 'end' },
])
const sortOptions = computed(() =>
    LIST.sorts.map((value) => ({
        value,
        title: t(`admin.authors.sorts.${value.replace(/^-/, '')}${value.startsWith('-') ? 'Desc' : 'Asc'}`),
    }))
)
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
watch(search, (value) => {
    if ((value ?? '').trim() !== state.value.q) sendSearch(value)
})
watch(
    () => state.value.q,
    (value) => {
        if ((search.value ?? '').trim() !== value) search.value = value
    }
)
const formOpen = ref(false)
const editedAuthor = ref(null)
function openForm(author) {
    editedAuthor.value = author
    formOpen.value = true
}
function onSaved(author, created) {
    showSuccess(undefined, {
        messageKey: created ? 'admin.authors.created' : 'admin.authors.updated',
        messageParams: { name: nameOf(author) },
    })
    reload()
}
const deleteOpen = ref(false)
const authorToDelete = ref(null)
const deleting = ref(false)
const addButton = ref(null)
const deleteFocus = useReturnFocus()
function askDelete(author) {
    if (deleting.value) return
    deleteFocus.remember()
    authorToDelete.value = author
    deleteOpen.value = true
}
watch(deleteOpen, async (open) => {
    if (!open) {
        await nextTick()
        deleteFocus.restore()
    }
})
async function deleteAuthor() {
    if (deleting.value || !authorToDelete.value) return
    const author = authorToDelete.value
    deleting.value = true
    try {
        await authorsApi.delete(author.id)
        showSuccess(undefined, { messageKey: 'admin.authors.deleted', messageParams: { name: nameOf(author) } })
        await reload()
        await nextTick()
        if (document.activeElement === document.body) addButton.value?.$el?.focus()
    } catch (failure) {
        const messageKey = resolveErrorKey(failure)
        showError(undefined, {
            messageKey,
            ...(messageKey === 'errors.AUTHOR_HAS_BOOKS' && { messageParams: { count: failure.details?.books } }),
        })
    } finally {
        deleting.value = false
    }
}
</script>

<style scoped>
.admin-authors__toolbar {
    display: grid;
    grid-template-columns: minmax(14rem, 2fr) minmax(14rem, 1fr) auto;
    gap: 12px;
    align-items: center;
}
@media (max-width: 959px) {
    .admin-authors__toolbar {
        grid-template-columns: 1fr;
    }
    .admin-authors__add {
        justify-self: start;
    }
}
</style>
