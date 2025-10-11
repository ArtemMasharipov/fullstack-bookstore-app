/**
 * Books composable - handles books data and operations
 */
import { useBooksStore } from '@/store'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useApi } from './useApi'
import { usePagination } from './usePagination'

export function useBooks(options = {}) {
    const { autoFetch = true, category = null, authorId = null, itemsPerPage = 12, enablePagination = true } = options

    // Stores
    const booksStore = useBooksStore()

    // Extract reactive state
    const { loading, error } = storeToRefs(booksStore)
    const books = computed(() => booksStore.booksList)
    const currentBook = computed(() => booksStore.currentBook)

    // Local reactive state
    const filters = ref({
        category: category,
        authorId: authorId,
        search: '',
        priceMin: null,
        priceMax: null,
        sortBy: 'title',
        sortOrder: 'asc',
    })

    const selectedBook = ref(null)

    // Computed properties
    const filteredBooks = computed(() => {
        let result = [...books.value]

        // Text search
        if (filters.value.search) {
            const search = filters.value.search.toLowerCase()
            result = result.filter(
                (book) =>
                    book.title.toLowerCase().includes(search) ||
                    book.author.toLowerCase().includes(search) ||
                    book.description?.toLowerCase().includes(search)
            )
        }

        // Category filter
        if (filters.value.category) {
            result = result.filter((book) => book.category === filters.value.category)
        }

        // Author filter
        if (filters.value.authorId) {
            result = result.filter((book) => book.authorId === filters.value.authorId)
        }

        // Price range filter
        if (filters.value.priceMin !== null) {
            result = result.filter((book) => book.price >= filters.value.priceMin)
        }
        if (filters.value.priceMax !== null) {
            result = result.filter((book) => book.price <= filters.value.priceMax)
        }

        // Sorting
        result.sort((a, b) => {
            const key = filters.value.sortBy
            const order = filters.value.sortOrder === 'asc' ? 1 : -1

            if (key === 'price') {
                return (a.price - b.price) * order
            }

            return a[key]?.localeCompare(b[key]) * order || 0
        })

        return result
    })

    const isEmpty = computed(() => filteredBooks.value.length === 0)
    const hasFilters = computed(() => {
        return (
            filters.value.search ||
            filters.value.category ||
            filters.value.authorId ||
            filters.value.priceMin !== null ||
            filters.value.priceMax !== null
        )
    })

    // Pagination setup (optional)
    const pagination = enablePagination ? usePagination(filteredBooks, itemsPerPage) : null
    const displayedBooks = enablePagination ? pagination.paginatedItems : filteredBooks

    // API composables for individual operations
    const fetchBooksApi = useApi(booksStore.fetchBooks.bind(booksStore), {
        context: 'books-fetch',
        showErrorToast: false, // Let the store handle notifications
    })

    const fetchBookByIdApi = useApi(booksStore.fetchBookById.bind(booksStore), {
        context: 'books-fetch-by-id',
        showErrorToast: false,
    })

    const createBookApi = useApi(booksStore.createBook.bind(booksStore), {
        context: 'books-create',
        showErrorToast: false,
    })

    const updateBookApi = useApi(booksStore.updateBook.bind(booksStore), {
        context: 'books-update',
        showErrorToast: false,
    })

    const deleteBookApi = useApi(booksStore.deleteBook.bind(booksStore), {
        context: 'books-delete',
        showErrorToast: false,
    })

    // Methods
    async function fetchBooks() {
        try {
            await fetchBooksApi.execute()
        } catch (error) {
            logger.error('Failed to fetch books', error, 'books')
            throw error
        }
    }

    async function fetchBookById(id) {
        try {
            await fetchBookByIdApi.execute(id)
        } catch (error) {
            logger.error('Failed to fetch book details', error, 'books')
            throw error
        }
    }

    async function searchBooks(query) {
        filters.value.search = query
        if (pagination) {
            pagination.goToPage(1) // Reset to first page when searching
        }
    }

    function updateFilters(newFilters) {
        Object.assign(filters.value, newFilters)
        if (pagination) {
            pagination.goToPage(1) // Reset to first page when filtering
        }
    }

    function clearFilters() {
        filters.value = {
            category: null,
            authorId: null,
            search: '',
            priceMin: null,
            priceMax: null,
            sortBy: 'title',
            sortOrder: 'asc',
        }
        if (pagination) {
            pagination.goToPage(1)
        }
    }

    function setSortBy(key, order = 'asc') {
        filters.value.sortBy = key
        filters.value.sortOrder = order
    }

    function toggleSortOrder() {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
    }

    function selectBook(book) {
        selectedBook.value = book
    }

    // Admin methods (if user has permissions)
    async function createBook(bookData) {
        try {
            await createBookApi.execute(bookData)
            logger.info('Book created successfully', null, 'books')
            await fetchBooks() // Refresh list
        } catch (error) {
            logger.error('Failed to create book', error, 'books')
            throw error
        }
    }

    async function updateBook(id, bookData) {
        try {
            await updateBookApi.execute({ id, formData: bookData })
            logger.info('Book updated successfully', null, 'books')
            await fetchBooks() // Refresh list
        } catch (error) {
            logger.error('Failed to update book', error, 'books')
            throw error
        }
    }

    async function deleteBook(id) {
        try {
            await deleteBookApi.execute(id)
            logger.info('Book deleted successfully', null, 'books')
            await fetchBooks() // Refresh list
        } catch (error) {
            logger.error('Failed to delete book', error, 'books')
            throw error
        }
    }

    // Watch for filter changes to auto-refetch if needed
    watch(
        () => filters.value.category,
        () => {
            if (autoFetch) {
                fetchBooks()
            }
        }
    )

    watch(
        () => filters.value.authorId,
        () => {
            if (autoFetch) {
                fetchBooks()
            }
        }
    )

    // Auto-fetch on mount if enabled
    if (autoFetch) {
        onMounted(fetchBooks)
    }

    return {
        // State
        books: displayedBooks,
        allBooks: filteredBooks,
        currentBook,
        loading,
        error,
        filters,
        selectedBook,

        // Computed
        isEmpty,
        hasFilters,

        // Pagination (if enabled)
        ...(pagination || {}),

        // Methods
        fetchBooks,
        fetchBookById,
        searchBooks,
        updateFilters,
        clearFilters,
        setSortBy,
        toggleSortOrder,
        selectBook,

        // Admin methods
        createBook,
        updateBook,
        deleteBook,

        // API states (for fine-grained control)
        apiStates: {
            fetchBooks: fetchBooksApi,
            fetchBookById: fetchBookByIdApi,
            createBook: createBookApi,
            updateBook: updateBookApi,
            deleteBook: deleteBookApi,
        },

        // Store methods
        clearError: booksStore.clearError,
        resetState: booksStore.resetState,
    }
}
