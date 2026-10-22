<template>
    <div>
        <admin-table
            must-sort
            :headers="headers"
            :items="error ? [] : items"
            :items-length="total"
            :loading="loading"
            :error="error"
            :page="state.page"
            :limit="state.limit"
            :sort-by="state.sortBy"
            :filtered="filtered"
            :empty-text="t(filtered ? 'admin.users.noResults' : 'admin.users.empty')"
            @update:page="update({ page: $event })"
            @update:limit="update({ limit: $event })"
            @update:sort-by="update({ sortBy: $event ?? USERS_LIST.defaultSort })"
            @retry="reload"
            @reset-filters="resetFilters"
        >
            <template #toolbar>
                <div class="admin-users__heading mb-3">
                    <v-text-field
                        v-model="search"
                        :label="t('admin.users.search')"
                        :aria-label="t('admin.users.search')"
                        type="search"
                        maxlength="100"
                        prepend-inner-icon="mdi-magnify"
                        clearable
                        hide-details
                    />
                    <v-btn ref="addButton" prepend-icon="mdi-account-plus" @click="openForm(null)">{{
                        t('admin.users.add')
                    }}</v-btn>
                </div>
                <div class="admin-users__filters">
                    <v-select
                        :model-value="state.filters.role ?? ''"
                        :items="roles"
                        :label="t('admin.users.role')"
                        :open-text="t('admin.users.role')"
                        :close-text="t('admin.users.role')"
                        hide-details
                        @update:model-value="filter('role', $event)"
                    />
                    <v-select
                        :model-value="state.filters.isActive ?? ''"
                        :items="statuses"
                        :label="t('admin.users.status')"
                        :open-text="t('admin.users.status')"
                        :close-text="t('admin.users.status')"
                        hide-details
                        @update:model-value="filter('isActive', $event)"
                    />
                    <v-select
                        :model-value="state.sortBy"
                        :items="sortOptions"
                        :label="t('admin.users.sort')"
                        :open-text="t('admin.users.sort')"
                        :close-text="t('admin.users.sort')"
                        hide-details
                        @update:model-value="update({ sortBy: $event })"
                    />
                </div>
                <v-btn v-if="filtered" variant="text" class="mt-2" @click="resetFilters">{{
                    t('catalog.resetFilters')
                }}</v-btn>
            </template>
            <template #item.name="{ item }">{{
                [item.firstName, item.lastName].filter(Boolean).join(' ') || t('common.notAvailable')
            }}</template>
            <template #item.role="{ item }"
                ><v-chip size="small" variant="tonal">{{ t(`admin.roles.${item.role}`) }}</v-chip></template
            >
            <template #item.isActive="{ item }">
                <v-chip size="small" variant="tonal" :color="item.isActive ? 'success' : undefined">{{
                    t(item.isActive ? 'admin.users.active' : 'admin.users.inactive')
                }}</v-chip>
            </template>
            <template #item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
            <template #item.lastLogin="{ item }">{{ formatDateTime(item.lastLogin) }}</template>
            <template #item.actions="{ item }">
                <div class="d-flex justify-end">
                    <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        size="small"
                        :aria-label="t('admin.users.edit', { name: item.username })"
                        @click="openForm(item)"
                    />
                    <v-btn
                        :icon="item.isActive ? 'mdi-account-off' : 'mdi-account-check'"
                        variant="text"
                        size="small"
                        :disabled="changingStatus || isSelf(item)"
                        :aria-describedby="isSelf(item) ? `self-status-${item.id}` : undefined"
                        :aria-label="
                            t(item.isActive ? 'admin.users.deactivate' : 'admin.users.activate', {
                                name: item.username,
                            })
                        "
                        @click="askStatus(item)"
                    />
                </div>
                <p v-if="isSelf(item)" :id="`self-status-${item.id}`" class="text-caption">
                    {{ t('admin.users.selfHint') }}
                </p>
            </template>
            <template #empty-action
                ><v-btn prepend-icon="mdi-account-plus" @click="openForm(null)">{{
                    t('admin.users.add')
                }}</v-btn></template
            >
        </admin-table>
        <user-form-dialog
            v-model="formOpen"
            :user="editedUser"
            :is-self="Boolean(editedUser && isSelf(editedUser))"
            @saved="onSaved"
        />
        <confirm-modal
            v-model="statusOpen"
            :title="t('admin.users.statusTitle')"
            :message="statusMessage"
            @confirm="changeStatus"
            @after-leave="statusClosed = true"
        />
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import AdminTable from '@/components/features/admin/AdminTable.vue'
import UserFormDialog from '@/components/features/admin/UserFormDialog.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useAdminList } from '@/composables/useAdminList'
import { useNotifications } from '@/composables/useNotifications'
import { useReturnFocus } from '@/composables/useReturnFocus'
import { t } from '@/i18n'
import { usersApi } from '@/services/api/usersApi'
import { useAuthStore } from '@/stores/auth'
import { formatDate, formatDateTime } from '@/utils/date'
import { resolveErrorKey } from '@/utils/errorResolver'
import { debounce } from '@/utils/helpers/debounce'
import { USERS_LIST } from './adminListConfig'

const auth = useAuthStore()
const isSelf = (user) => user.id === auth.user?.id
const { state, items, total, loading, error, update, reload } = useAdminList({
    config: USERS_LIST,
    load: (params) => usersApi.list(params),
})
const { showSuccess, showError } = useNotifications()
const filtered = computed(() => Boolean(state.value.q || Object.keys(state.value.filters).length))
const headers = computed(() =>
    ['username', 'email', 'name', 'role', 'isActive', 'createdAt', 'lastLogin', 'actions'].map((key) => ({
        key,
        title: t(`admin.users.columns.${key}`),
        sortable: ['username', 'email', 'createdAt', 'lastLogin'].includes(key),
        ...(key === 'actions' && { align: 'end' }),
    }))
)
const roles = computed(() => [
    { value: '', title: t('admin.users.allRoles') },
    ...['user', 'admin'].map((value) => ({ value, title: t(`admin.roles.${value}`) })),
])
const statuses = computed(() => [
    { value: '', title: t('admin.users.allStatuses') },
    ...['true', 'false'].map((value) => ({
        value,
        title: t(value === 'true' ? 'admin.users.active' : 'admin.users.inactive'),
    })),
])
const sortOptions = computed(() =>
    USERS_LIST.sorts.map((value) => ({
        value,
        title: t(`admin.users.sorts.${value.replace(/^-/, '')}${value.startsWith('-') ? 'Desc' : 'Asc'}`),
    }))
)
const filter = (key, value) => update({ filters: { ...state.value.filters, [key]: value } })
const resetFilters = () => update({ q: '', filters: {} })
const search = ref(state.value.q)
const sendSearch = debounce((value) => update({ q: (value ?? '').trim() }), 300)
watch(search, (value) => {
    sendSearch.cancel()
    if ((value ?? '').trim() !== state.value.q) sendSearch(value)
})
watch(
    () => state.value.q,
    (value) => {
        sendSearch.cancel()
        if ((search.value ?? '').trim() !== value) search.value = value
    }
)
onBeforeRouteLeave(() => sendSearch.cancel())
onBeforeUnmount(() => sendSearch.cancel())

const formOpen = ref(false)
const editedUser = ref(null)
function openForm(user) {
    editedUser.value = user
    formOpen.value = true
}
function onSaved(user, created) {
    showSuccess(undefined, {
        messageKey: created ? 'admin.users.created' : 'admin.users.updated',
        messageParams: { name: user.username },
    })
    reload()
}

const statusOpen = ref(false)
const statusTarget = ref(null)
const changingStatus = ref(false)
const statusClosed = ref(true)
const addButton = ref(null)
const statusFocus = useReturnFocus()
let opener = null
const statusMessage = computed(() =>
    statusTarget.value
        ? t(statusTarget.value.isActive ? 'admin.users.deactivateMessage' : 'admin.users.activateMessage', {
              name: statusTarget.value.username,
          })
        : ''
)
function askStatus(user) {
    if (changingStatus.value || isSelf(user)) return
    opener = document.activeElement
    statusFocus.remember()
    statusTarget.value = user
    statusClosed.value = false
    statusOpen.value = true
}
watch([items, changingStatus, statusClosed], async () => {
    if (statusOpen.value || changingStatus.value || !statusClosed.value) return
    await nextTick()
    if (document.activeElement !== document.body && document.activeElement !== opener) return
    if (opener?.isConnected && !opener.disabled) statusFocus.restore()
    else addButton.value?.$el?.focus()
})
async function changeStatus() {
    if (changingStatus.value || !statusTarget.value) return
    const user = statusTarget.value
    const nextActive = !user.isActive
    changingStatus.value = true
    try {
        await usersApi.setStatus(user.id, nextActive)
        showSuccess(undefined, {
            messageKey: nextActive ? 'admin.users.activated' : 'admin.users.deactivated',
            messageParams: { name: user.username },
        })
        await reload()
    } catch (failure) {
        showError(undefined, { messageKey: resolveErrorKey(failure) })
    } finally {
        changingStatus.value = false
    }
}
</script>

<style scoped>
.admin-users__heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
}
.admin-users__filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}
@media (max-width: 959px) {
    .admin-users__heading,
    .admin-users__filters {
        grid-template-columns: 1fr;
    }
    .admin-users__heading .v-btn {
        justify-self: start;
    }
}
</style>
