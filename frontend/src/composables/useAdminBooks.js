import { useAuthorsStore } from '@/store/modules/authors/authors'
import { useBooksStore } from '@/store/modules/books/books'
import { useBooksUiStore } from '@/store/modules/books/booksUi'
import { computed, ref } from 'vue'

/**
 * Composable for admin books management
 * Handles books CRUD operations, filtering, pagination, and UI state
 */
export function useAdminBooks() {
    // Stores
    const booksStore = useBooksStore()
    const authorsStore = useAuthorsStore()
    const booksUiStore = useBooksUiStore()

    // Reactive state
    const loading = ref(false)
    const error = ref(null)
    // Dialog states
    const bookDialogOpen = ref(false)
    const deleteDialogOpen = ref(false)
    const editedBook = ref(null)
    const bookToDelete = ref(null)

    // Loading states
    const saving = ref(false)
    const deleting = ref(false)

    // Filters
    const search = ref('')
    const sortBy = ref('title')

    // Pagination
    const page = ref(1)
    const itemsPerPage = ref(10)

    // Computed properties
    const books = computed(() => booksStore.getAllBooks)
    const authors = computed(() => authorsStore.getAllAuthors)
    const totalItems = computed(() => filteredBooks.value.length) // Filtered books based on current filters
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

    // Paginated books
    const paginatedBooks = computed(() => {
        const start = (page.value - 1) * itemsPerPage.value
        const end = start + itemsPerPage.value
        return filteredBooks.value.slice(start, end)
    }) // Methods
    async function loadBooks() {
        loading.value = true
        error.value = null

        try {
            await booksStore.fetchBooks()
        } catch (err) {
            error.value = err.message || 'Failed to fetch books'
            console.error('Error fetching books:', err)
        } finally {
            loading.value = false
        }
    }

    async function loadAuthors() {
        try {
            await authorsStore.fetchAuthors()
        } catch (err) {
            console.error('Error fetching authors:', err)
        }
    }

    function openBookDialog(book = null) {
        editedBook.value = book
        bookDialogOpen.value = true
    }

    function closeBookDialog() {
        bookDialogOpen.value = false
        editedBook.value = null
    }

    function confirmDeleteBook(book) {
        bookToDelete.value = book
        deleteDialogOpen.value = true
    }

    function closeDeleteDialog() {
        deleteDialogOpen.value = false
        bookToDelete.value = null
    }

    async function handleSaveBook(bookData) {
        saving.value = true
        error.value = null

        try {
            if (bookData.id) {
                // Update existing book
                await booksStore.updateBook(bookData.id, bookData)
            } else {
                // Create new book
                await booksStore.createBook(bookData)
            }

            closeBookDialog()
            await loadBooks() // Refresh the list
        } catch (err) {
            error.value = err.message || 'Failed to save book'
            console.error('Error saving book:', err)
            throw err // Re-throw so the dialog can handle it
        } finally {
            saving.value = false
        }
    }

    async function handleDeleteBook() {
        if (!bookToDelete.value) return

        deleting.value = true
        error.value = null

        try {
            await booksStore.deleteBook(bookToDelete.value.id)
            closeDeleteDialog()
            await loadBooks() // Refresh the list
        } catch (err) {
            error.value = err.message || 'Failed to delete book'
            console.error('Error deleting book:', err)
            throw err // Re-throw so the dialog can handle it
        } finally {
            deleting.value = false
        }
    } // Filter and pagination methods
    function updateSearch(query) {
        search.value = query
        page.value = 1 // Reset to first page
    }

    function updateSortBy(sortField) {
        sortBy.value = sortField
    }

    function resetFilters() {
        search.value = ''
        page.value = 1
    }

    // Pagination methods
    function updatePage(newPage) {
        page.value = newPage
    }

    function updateItemsPerPage(newItemsPerPage) {
        itemsPerPage.value = newItemsPerPage
        page.value = 1 // Reset to first page
    }

    // Initialize data
    async function initialize() {
        await Promise.all([fetchBooks(), fetchAuthors()])
    }
    return {
        // State
        books: paginatedBooks,
        authors,
        loading,
        error,
        totalItems,

        // Pagination
        page,
        itemsPerPage,

        // Filters
        search,
        sortBy,

        // Dialogs
        bookDialogOpen,
        deleteDialogOpen,
        editedBook,
        bookToDelete,
        saving,
        deleting,

        // Methods
        loadBooks,
        loadAuthors,

        // Dialog methods
        openBookDialog,
        closeBookDialog,
        confirmDeleteBook,
        closeDeleteDialog,

        // CRUD methods
        handleSaveBook,
        handleDeleteBook,

        // Filter methods
        updateSearch,
        updateSortBy,
        resetFilters,

        // Pagination methods
        updatePage,
        updateItemsPerPage,
    }
}
