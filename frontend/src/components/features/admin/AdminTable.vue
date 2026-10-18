<template>
    <div class="admin-table">
        <div v-if="$slots.toolbar" class="mb-4">
            <slot name="toolbar" />
        </div>

        <v-alert v-if="error" type="error" class="mb-4">
            <div class="d-flex flex-wrap align-center ga-3">
                <span>{{ t('admin.table.loadError') }}</span>
                <v-btn variant="outlined" @click="emit('retry')">{{ t('errors.retry') }}</v-btn>
            </div>
        </v-alert>

        <v-defaults-provider :defaults="FOOTER_DEFAULTS">
            <v-data-table-server
                :headers="headers"
                :items="items"
                :items-length="itemsLength"
                :loading="loading"
                :page="page"
                :items-per-page="limit"
                :items-per-page-options="ADMIN_PAGE_SIZES"
                :sort-by="vuetifySort"
                @update:page="emit('update:page', $event)"
                @update:items-per-page="emit('update:limit', $event)"
                @update:sort-by="onSort"
            >
                <template v-for="name in cellSlots" :key="name" #[name]="cell">
                    <slot :name="name" v-bind="cell" />
                </template>

                <template #no-data>
                    <div v-if="!error" class="py-8 text-center">
                        <p class="mb-4">{{ emptyText }}</p>
                        <v-btn v-if="filtered" variant="outlined" @click="emit('resetFilters')">
                            {{ t('catalog.resetFilters') }}
                        </v-btn>
                        <slot v-else name="empty-action" />
                    </div>
                </template>
            </v-data-table-server>
        </v-defaults-provider>
    </div>
</template>

<script setup>
import { t } from '@/i18n'
import { ADMIN_PAGE_SIZES } from '@/router/adminListQuery'
import { computed, useSlots } from 'vue'

/**
 * A page of an admin list on Vuetify's server-side table. The screen owns the state (useAdminList); the table shows
 * it and reports the page, the page size and the sort the person picks. The sort is the API's key: "price",
 * "-price", or null when the person clears it. Cells are the screen's `item.<key>` slots.
 */

const props = defineProps({
    headers: { type: Array, required: true },
    items: { type: Array, default: () => [] },
    itemsLength: { type: Number, default: 0 },
    loading: Boolean,
    // The API error of the last load, or null
    error: { type: Object, default: null },
    page: { type: Number, default: 1 },
    limit: { type: Number, default: 10 },
    sortBy: { type: String, default: null },
    // Why the list is empty
    emptyText: { type: String, required: true },
    // The list is empty because of the search or the filters
    filtered: Boolean,
})

// Vuetify names its rows-per-page select "Open"; the text shown next to it is its name
const FOOTER_DEFAULTS = {
    VSelect: {
        openText: '$vuetify.dataFooter.itemsPerPageText',
        closeText: '$vuetify.dataFooter.itemsPerPageText',
    },
}

const emit = defineEmits(['update:page', 'update:limit', 'update:sortBy', 'retry', 'resetFilters'])

const slots = useSlots()
const cellSlots = computed(() => Object.keys(slots).filter((name) => name.startsWith('item.')))

const vuetifySort = computed(() =>
    props.sortBy ? [{ key: props.sortBy.replace(/^-/, ''), order: props.sortBy.startsWith('-') ? 'desc' : 'asc' }] : []
)

const onSort = (sort) =>
    emit('update:sortBy', sort.length ? `${sort[0].order === 'desc' ? '-' : ''}${sort[0].key}` : null)
</script>
