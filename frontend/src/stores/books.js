import { booksApi } from '@/api/booksApi'
import { defineStore } from 'pinia'
import { handleAsyncAction } from './utils/stateHelpers'

export const useBooksStore = defineStore('books', {
  state: () => ({
    list: {
      books: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    },
    current: null,
    loading: false,
    error: null
  }),
  
  getters: {
    booksList: (state) => state.list.books,
    pagination: (state) => state.list.pagination,
    currentBook: (state) => state.current,
    booksLoading: (state) => state.loading,
    booksError: (state) => state.error
  },
  
  actions: {
    async fetchBooks(params = { page: 1, limit: 10 }) {
      return handleAsyncAction(this, async () => {
        const response = await booksApi.fetchAll(params)
        this.setBooksList(response)
        return response
      })
    },
    
    async fetchBookById(id) {
      return handleAsyncAction(this, async () => {
        const book = await booksApi.fetchById(id)
        this.current = book
        return book
      })
    },
    
    async createBook(formData) {
      return handleAsyncAction(this, async () => {
        const book = await booksApi.create(formData)
        this.list.books.push(book)
        return book
      })
    },
    
    async updateBook({ id, formData }) {
      return handleAsyncAction(this, async () => {
        const updatedBook = await booksApi.update(id, formData)
        const index = this.list.books.findIndex(book => book._id === updatedBook._id)
        if (index !== -1) {
          this.list.books.splice(index, 1, updatedBook)
        }
        return updatedBook
      })
    },
    
    async deleteBook(id) {
      if (!id) throw new Error('Book ID is required')
      
      return handleAsyncAction(this, async () => {
        await booksApi.delete(id)
        this.list.books = this.list.books.filter(book => book._id !== id)
      })
    },
    
    // Вспомогательный метод для обработки различных форматов ответа API
    setBooksList(response) {
      if (Array.isArray(response)) {
        // Если API вернул просто массив книг
        this.list.books = response
        // Установим базовую пагинацию
        this.list.pagination = {
          page: 1,
          limit: response.length,
          total: response.length,
          pages: 1
        }
      } else if (response && typeof response === 'object') {
        // Если API вернул объект с книгами и пагинацией
        this.list.books = response.books || response.data || []
        this.list.pagination = response.pagination || {
          page: 1,
          limit: this.list.books.length,
          total: this.list.books.length,
          pages: 1
        }
      } else {
        // Если ответ неожиданного формата, установим пустой список
        this.list.books = []
        this.list.pagination = {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        }
      }
    }
  }
})