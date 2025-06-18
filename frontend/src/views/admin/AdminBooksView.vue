<template>
    <div class="admin-books">
        <!-- Book management data table -->
        <admin-books-table :books="paginatedBooks" :authors="authors" :loading="loading" :total-items="totalItems"
            :page="page" :items-per-page="itemsPerPage" :sort-by="sortBy" :search="search" @update:page="updatePage"
            @update:items-per-page="updateItemsPerPage" @update:sort-by="updateSortBy" @update:search="updateSearch"
            @reset-filters="resetFilters" @add-book="openBookDialog" @edit-book="openBookDialog"
            @delete-book="confirmDeleteBook" />

        <!-- Book edit/create dialog -->
        <book-dialog v-model="bookDialogOpen" :book="editedBook" :authors="authors" :saving="saving"
            @save="handleSaveBook" @close="closeBookDialog" />

        <!-- Delete confirmation dialog -->
        <book-delete-dialog v-model="deleteDialogOpen" :book="bookToDelete" :deleting="deleting"
            @delete="handleDeleteBook" @close="closeDeleteDialog" />
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

// Components
import AdminBooksTable from '@/components/features/admin/AdminBooksTable.vue'
import BookDeleteDialog from '@/components/features/admin/BookDeleteDialog.vue'
import BookDialog from '@/components/features/admin/BookDialog.vue'

// Stores
import { useAuthorsStore } from '@/store/modules/authors'
import { useBooksStore } from '@/store/modules/books'

// Utils
import { logger } from '@/utils/logger'

// Store instances
const booksStore = useBooksStore()
const authorsStore = useAuthorsStore()

// Dialog states
const bookDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editedBook = ref(null)
const bookToDelete = ref(null)

// Loading states
const saving = ref(false)
const deleting = ref(false)

// Table state
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref([{ key: 'title', order: 'asc' }])
const search = ref('')

// Data from stores
const books = computed(() => booksStore.getAllBooks || [])
const authors = computed(() => authorsStore.getAllAuthors || [])
const loading = computed(() => booksStore.loading)

// Filtered and paginated data
const filteredBooks = computed(() => {
    let result = books.value

    // Search filter
    if (search.value) {
        const query = search.value.toLowerCase()
        result = result.filter(
            (book) =>
                book.title?.toLowerCase().includes(query) ||
                book.isbn?.toLowerCase().includes(query) ||
                book.author?.name?.toLowerCase().includes(query) ||
                book.category?.toLowerCase().includes(query)
        )
    }

    return result
})

const totalItems = computed(() => filteredBooks.value.length)

const paginatedBooks = computed(() => {
    const start = (page.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredBooks.value.slice(start, end)
})

// Data loading methods
const loadBooks = async () => {
    try {
        await booksStore.fetchBooks()
    } catch (error) {
        logger.error('Failed to load books', error, 'admin-books')
    }
}

const loadAuthors = async () => {
    try {
        await authorsStore.fetchAuthors()
    } catch (error) {
        logger.error('Error fetching authors', error, 'admin-books')
    }
}

// Dialog methods
const openBookDialog = (book = null) => {
    editedBook.value = book
    bookDialogOpen.value = true
}

const closeBookDialog = () => {
    bookDialogOpen.value = false
    editedBook.value = null
    saving.value = false
}

const confirmDeleteBook = (book) => {
    bookToDelete.value = book
    deleteDialogOpen.value = true
}

const closeDeleteDialog = () => {
    deleteDialogOpen.value = false
    bookToDelete.value = null
    deleting.value = false
}

// CRUD operations
const handleSaveBook = async (bookData) => {
    saving.value = true

    try {
        if (bookData.id) {
            // Update existing book
            await booksStore.updateBook(bookData.id, bookData)
            logger.info('Book updated successfully', { title: bookData.title, id: bookData.id }, 'admin-books')
        } else {
            // Create new book
            await booksStore.createBook(bookData)
            logger.info('Book created successfully', { title: bookData.title }, 'admin-books')
        }

        closeBookDialog()
        await loadBooks() // Refresh the list
    } catch (error) {
        logger.error('Failed to save book', error, 'admin-books')
    } finally {
        saving.value = false
    }
}

const handleDeleteBook = async () => {
    if (!bookToDelete.value) return

    deleting.value = true

    try {
        await booksStore.deleteBook(bookToDelete.value.id)
        logger.info(`Book "${bookToDelete.value.title}" deleted successfully`, 'admin-books')

        closeDeleteDialog()
        await loadBooks() // Refresh the list
    } catch (error) {
        logger.error(`Failed to delete book: ${error.message || 'Unknown error'}`, error, 'admin-books')
    } finally {
        deleting.value = false
    }
}

// Table event handlers
const updatePage = (newPage) => {
    page.value = newPage
}

const updateItemsPerPage = (newItemsPerPage) => {
    itemsPerPage.value = newItemsPerPage
    page.value = 1 // Reset to first page
}

const updateSortBy = (sortField) => {
    sortBy.value = sortField
}

const updateSearch = (query) => {
    search.value = query
    page.value = 1 // Reset to first page
}

const resetFilters = () => {
    search.value = ''
    page.value = 1
}

onMounted(async () => {
    await loadBooks()
    await loadAuthors()
})
</script>

<style scoped>
.admin-books {
    padding: 16px;
}
</style>
