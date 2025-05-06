import { authorsApi } from '@/api/authorsApi'
import { defineStore } from 'pinia'
import { handleAsyncAction } from './utils/stateHelpers'

export const useAuthorsStore = defineStore('authors', {
  state: () => ({
    list: [],
    current: null,
    loading: false,
    error: null
  }),
  
  getters: {
    authorsList: (state) => state.list,
    currentAuthor: (state) => state.current,
    authorsLoading: (state) => state.loading,
    authorsError: (state) => state.error
  },
  
  actions: {
    async fetchAuthors() {
      return handleAsyncAction(this, async () => {
        const authors = await authorsApi.fetchAll()
        this.list = authors
        return authors
      })
    },
    
    async fetchAuthorById(id) {
      return handleAsyncAction(this, async () => {
        const author = await authorsApi.fetchById(id)
        this.current = author
        return author
      })
    },
    
    async createAuthor(authorData) {
      return handleAsyncAction(this, async () => {
        const newAuthor = await authorsApi.create(authorData)
        this.list.push(newAuthor)
        return newAuthor
      })
    },
    
    async updateAuthor(authorData) {
      return handleAsyncAction(this, async () => {
        const updatedAuthor = await authorsApi.update(authorData._id, authorData)
        const index = this.list.findIndex((author) => author._id === updatedAuthor._id)
        if (index !== -1) {
          this.list.splice(index, 1, updatedAuthor)
        }
        return updatedAuthor
      })
    },
    
    async deleteAuthor(authorId) {
      return handleAsyncAction(this, async () => {
        await authorsApi.delete(authorId)
        this.list = this.list.filter((author) => author._id !== authorId)
        return true
      })
    }
  }
})