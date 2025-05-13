import { booksApi } from '@/api/booksApi';
import { toast } from '.';
import { handleAsyncAction } from './utils/stateHelpers';
import { createBaseStore } from './utils/storeFactory';

/**
 * Books store using the base store factory
 * - Uses shared logic from the factory to eliminate code duplication
 * - Preserves specific book store functionality
 */
export const useBooksStore = createBaseStore({
  id: 'books',
  api: booksApi,
  
  // Custom state specific to books store
  customState: () => ({
    // Override the default base state to match the specific structure needed for books
    list: {
      books: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    }
  }),
    // Custom getters specific to books store
  customGetters: {
    booksList: (state) => state.list.books,
    booksPagination: (state) => state.list.pagination,
    currentBook: (state) => state.current,
    booksLoading: (state) => state.loading,
    booksError: (state) => state.error
  },
  
  // Custom actions specific to books store
  customActions: {
    /**
     * Fetch books with pagination
     * @param {Object} params - Query parameters
     * @returns {Promise} - Fetched books
     */
    async fetchBooks(params = { page: 1, limit: 10 }) {
      return handleAsyncAction(this, async () => {
        const response = await booksApi.fetchAll(params);
        this.setBooksList(response);
        return response;
      });
    },
    
    /**
     * Fetch book by ID
     * @param {string} id - Book ID
     * @returns {Promise} - Book object
     */
    async fetchBookById(id) {
      return handleAsyncAction(this, async () => {
        const book = await booksApi.fetchById(id);
        this.current = book;
        return book;
      });
    },
      /**
     * Create a new book
     * @param {Object|FormData} formData - Book data
     * @returns {Promise} - Created book
     */
    async createBook(formData) {
      
      return handleAsyncAction(this, 
        async () => {
          const book = await booksApi.create(formData);
          this.list.books.push(book);
          
          // Show success notification
          const title = formData instanceof FormData ? formData.get('title') || 'New book' : formData.title || 'New book';
          toast.success(`"${title}" has been created successfully`);
          
          return book;
        },
        {
          onError: (error) => {
            toast.error(`Failed to create book: ${error.message}`);
          }
        }
      );
    },
      /**
     * Update an existing book
     * @param {Object} params - Parameters object
     * @param {string} params.id - Book ID
     * @param {Object|FormData} params.formData - Updated book data
     * @returns {Promise} - Updated book
     */
    async updateBook({ id, formData }) {
      
      return handleAsyncAction(this, 
        async () => {
          const updatedBook = await booksApi.update(id, formData);
          const index = this.list.books.findIndex(book => book._id === updatedBook._id);
          if (index !== -1) {
            this.list.books.splice(index, 1, updatedBook);
          }
          
          // Show success notification
          toast.success(`"${updatedBook.title || 'Book'}" has been updated successfully`);
          
          return updatedBook;
        },
        {
          onError: (error) => {
            toast.error(`Failed to update book: ${error.message}`);
          }
        }
      );
    },
      /**
     * Delete a book
     * @param {string} id - Book ID
     * @param {string} title - Book title for notification (optional)
     */
    async deleteBook(id, title = '') {
      if (!id) throw new Error('Book ID is required');
      
      return handleAsyncAction(this, 
        async () => {
          // Find book title if not provided
          if (!title) {
            const book = this.list.books.find(b => b._id === id);
            title = book?.title || 'Book';
          }
          
          await booksApi.delete(id);
          this.list.books = this.list.books.filter(book => book._id !== id);
          
          // Show notification
          toast.warning(`"${title}" has been deleted`);
        },
        {
          onError: (error) => {
            toast.error(`Failed to delete book: ${error.message}`);
          }
        }
      );
    },
    
    /**
     * Helper method to handle different API response formats
     * @param {Array|Object} response - API response
     */
    setBooksList(response) {
      if (Array.isArray(response)) {
        // If API returned just an array of books
        this.list.books = response;
        // Set basic pagination
        this.list.pagination = {
          page: 1,
          limit: response.length,
          total: response.length,
          pages: 1
        };
      } else if (response && typeof response === 'object') {
        // If API returned an object with books and pagination
        this.list.books = response.books || response.data || [];
        this.list.pagination = response.pagination || {
          page: 1,
          limit: this.list.books.length,
          total: this.list.books.length,
          pages: 1
        };
      } else {
        // If response is unexpected format, set empty list
        this.list.books = [];
        this.list.pagination = {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        };
      }
    }
  }
});