import { usersApi } from '@/api/usersApi'
import { defineStore } from 'pinia'
import { handleAsyncAction } from './utils/stateHelpers'

export const useUsersStore = defineStore('users', {
  state: () => ({
    list: [],
    current: null,
    loading: false,
    error: null
  }),
  
  getters: {
    usersList: (state) => state.list,
    currentUser: (state) => state.current,
    usersLoading: (state) => state.loading,
    usersError: (state) => state.error,
    getUserById: (state) => (id) => state.list.find((user) => user.id === id)
  },
  
  actions: {
    async fetchUsers() {
      return handleAsyncAction(this, async () => {
        const users = await usersApi.fetchAll()
        this.list = users
        return users
      })
    },
    
    async fetchUserById(id) {
      return handleAsyncAction(this, async () => {
        const user = await usersApi.fetchById(id)
        this.current = user
        return user
      })
    },
    
    async createUser(userData) {
      return handleAsyncAction(this, async () => {
        const user = await usersApi.create(userData)
        this.current = user
        return user
      })
    },
    
    async updateUser({ id, userData }) {
      return handleAsyncAction(this, async () => {
        const user = await usersApi.update(id, userData)
        this.current = user
        return user
      })
    },
    
    async deleteUser(id) {
      return handleAsyncAction(this, async () => {
        await usersApi.delete(id)
        this.current = null
      })
    }
  }
})