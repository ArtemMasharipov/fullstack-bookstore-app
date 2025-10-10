import { useBooksStore } from '@/store'
import { useAuthorsStore } from '@/store/modules/authors/authors'
import { logger } from '@/utils/logger'
import { computed, ref } from 'vue'
import { useApi } from './useApi'

/**
 * Admin books composable - handles admin book operations
 */
export function useAdminBooks() {
    // Stores
    const booksStore = useBooksStore()
    const authorsStore = useAuthorsStore()

    // API composables for individual operations
    const loadBooksApi = useApi(booksStore.fetchBooks.bind(booksStore), {
        context: 'admin-books-load',
        showErrorToast: false
    })

    const loadAuthorsApi = useApi(authorsStore.fetchAuthors.bind(authorsStore), {
        context: 'admin-authors-load',
        showErrorToast: false
    })

    const saveBookApi = useApi(async (bookData) => {
        if (bookData.id) {
            return await booksStore.updateBook(bookData.id, bookData)
        } else {
            return await booksStore.createBook(bookData)
        }
    }, {
        context: 'admin-books-save',
        showErrorToast: false
    })

    const deleteBookApi = useApi(booksStore.deleteBook.bind(booksStore), {
        context: 'admin-books-delete',
        showErrorToast: false
    })

    // Dialog states
    const bookDialogOpen = ref(false)
    const deleteDialogOpen = ref(false)
    const editedBook = ref(null)
    const bookToDelete = ref(null)

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
    })     // Methods
    async function loadBooks() {
        try {
            await loadBooksApi.execute()
        } catch (err) {
            console.error('Error fetching books:', err)
            throw err
        }
    }

    async function loadAuthors() {
        try {
            await loadAuthorsApi.execute()
        } catch (err) {
            logger.error('Error fetching authors', err, 'admin-books')
            throw err
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
        try {
            await saveBookApi.execute(bookData)
            closeBookDialog()
            await loadBooks() // Refresh the list
        } catch (err) {
            console.error('Error saving book:', err)
            throw err // Re-throw so the dialog can handle it
        }
    }

    async function handleDeleteBook() {
        if (!bookToDelete.value) return

        try {
            await deleteBookApi.execute(bookToDelete.value.id)
            closeDeleteDialog()
            await loadBooks() // Refresh the list
        } catch (err) {
            console.error('Error deleting book:', err)
            throw err // Re-throw so the dialog can handle it
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
        await Promise.all([loadBooks(), loadAuthors()])
    }
    return {
        // State
        books: paginatedBooks,
        authors,
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

        // API states (for fine-grained control)
        apiStates: {
            loadBooks: loadBooksApi,
            loadAuthors: loadAuthorsApi,
            saveBook: saveBookApi,
            deleteBook: deleteBookApi,
        },

        // Computed loading/error states
        loading: computed(() => 
            loadBooksApi.isLoading.value || 
            loadAuthorsApi.isLoading.value || 
            saveBookApi.isLoading.value || 
            deleteBookApi.isLoading.value
        ),
        error: computed(() => 
            loadBooksApi.error.value || 
            loadAuthorsApi.error.value || 
            saveBookApi.error.value || 
            deleteBookApi.error.value
        ),
        saving: saveBookApi.isLoading,
        deleting: deleteBookApi.isLoading,
    }
}
