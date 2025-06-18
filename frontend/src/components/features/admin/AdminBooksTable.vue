<template>
    <AdminDataTable title="Books Management" :subtitle="`${totalItems} books total`" :headers="headers" :items="books"
        :loading="loading" :total-items="totalItems" :page="page" :items-per-page="itemsPerPage" show-search
        search-label="Search books..." show-filters show-reset-filters @update:page="$emit('update:page', $event)"
        @update:items-per-page="$emit('update:items-per-page', $event)" @update:search="$emit('update:search', $event)"
        @reset-filters="$emit('reset-filters')">
        <!-- Actions in header -->
        <template #actions>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="$emit('add-book')"> Add Book </v-btn>
        </template>
        <!-- Custom filters -->
        <template #filters>
            <v-col cols="12" sm="6" md="3">
                <v-select :value="selectedAuthor" :items="authorOptions" label="Filter by Author" density="comfortable"
                    variant="outlined" hide-details clearable @update:model-value="$emit('filter:author', $event)">
                </v-select>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-select :value="selectedCategory" :items="categoryOptions" label="Filter by Category"
                    density="comfortable" variant="outlined" hide-details clearable
                    @update:model-value="$emit('filter:category', $event)">
                </v-select>
            </v-col>
        </template>

        <!-- Custom item actions -->
        <template #item="{ item }">
            <v-btn icon="mdi-eye" size="small" variant="text" @click="$emit('view-book', item)" class="me-1"></v-btn>
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="$emit('edit-book', item)" class="me-1"></v-btn>
            <v-btn icon="mdi-delete" size="small" variant="text" color="error"
                @click="$emit('delete-book', item)"></v-btn>
        </template>

        <!-- Custom title column -->
        <template #[`item.title`]="{ item }">
            <div class="d-flex align-center">
                <v-avatar v-if="item.coverImage" size="40" class="me-3">
                    <v-img :src="item.coverImage" alt="Book cover"></v-img>
                </v-avatar>
                <div>
                    <div class="text-subtitle-2">{{ item.title }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.isbn }}</div>
                </div>
            </div>
        </template>

        <!-- Custom author column -->
        <template #[`item.author`]="{ item }">
            {{ item.author?.name || 'Unknown Author' }}
        </template>

        <!-- Custom price column -->
        <template #[`item.price`]="{ item }">
            <span class="text-primary font-weight-medium"> ${{ item.price?.toFixed(2) }} </span>
        </template>

        <!-- Custom stock column -->
        <template #[`item.stock`]="{ item }">
            <v-chip :color="getStockColor(item.stock)" size="small" variant="flat"> {{ item.stock }} in stock </v-chip>
        </template>

        <!-- Custom status column -->
        <template #[`item.status`]="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small" variant="flat">
                {{ item.status }}
            </v-chip>
        </template>
    </AdminDataTable>
</template>

<script setup>
import AdminDataTable from '@/components/features/admin/AdminDataTable.vue'
import { computed } from 'vue'

// Props
const props = defineProps({
    books: {
        type: Array,
        default: () => [],
    },
    authors: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    totalItems: {
        type: Number,
        default: 0,
    },
    page: {
        type: Number,
        default: 1,
    },
    itemsPerPage: {
        type: Number,
        default: 10,
    },
    selectedAuthor: {
        type: [String, Number],
        default: null,
    },
    selectedCategory: {
        type: String,
        default: null,
    },
})

// Emits
defineEmits([
    'update:page',
    'update:items-per-page',
    'update:search',
    'filter:author',
    'filter:category',
    'reset-filters',
    'add-book',
    'view-book',
    'edit-book',
    'delete-book',
])

// Computed properties
const headers = computed(() => [
    {
        title: 'Book',
        key: 'title',
        sortable: true,
    },
    {
        title: 'Author',
        key: 'author',
        sortable: true,
    },
    {
        title: 'Category',
        key: 'category',
        sortable: true,
    },
    {
        title: 'Price',
        key: 'price',
        sortable: true,
        align: 'end',
    },
    {
        title: 'Stock',
        key: 'stock',
        sortable: true,
        align: 'center',
    },
    {
        title: 'Status',
        key: 'status',
        sortable: true,
        align: 'center',
    },
    {
        title: 'Actions',
        key: 'actions',
        sortable: false,
        align: 'center',
    },
])

const authorOptions = computed(() => {
    return props.authors.map((author) => ({
        title: author.name,
        value: author.id,
    }))
})

const categoryOptions = computed(() => {
    // Extract unique categories from books
    const categories = [...new Set(props.books.map((book) => book.category).filter(Boolean))]
    return categories.map((category) => ({
        title: category,
        value: category,
    }))
})

// Methods
const getStockColor = (stock) => {
    if (stock <= 0) return 'error'
    if (stock <= 5) return 'warning'
    return 'success'
}

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'published':
        case 'active':
            return 'success'
        case 'draft':
            return 'warning'
        case 'discontinued':
        case 'inactive':
            return 'error'
        default:
            return 'default'
    }
}
</script>
