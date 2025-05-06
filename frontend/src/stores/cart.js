import { cartApi } from '@/api/cartApi'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { handleAsyncAction } from './utils/stateHelpers'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(localStorage.getItem('cart')) || [],
    loading: false,
    error: null
  }),
  
  getters: {
    cartItems: (state) => state.items.map(({ _id, bookId, quantity, price }) => ({
      _id,
      bookId: {
        _id: bookId?._id || bookId,
        title: bookId?.title || 'Unknown Book',
        image: bookId?.image
      },
      quantity: Number(quantity),
      price: Number(price)
    })),
    cartLoading: (state) => state.loading,
    cartError: (state) => state.error,
    cartTotal: (state) => {
      return state.items.reduce((total, item) => {
        return total + item.price * item.quantity
      }, 0)
    },
    itemCount: (state) => state.items.length
  },
  
  actions: {
    async fetchCart() {
      return handleAsyncAction(this, async () => {
        const { items = [] } = await cartApi.fetchCart() || {}
        this.setItems(items)
      })
    },
    
    async addToCart({ bookId, quantity, price }) {
      return handleAsyncAction(this, async () => {
        const authStore = useAuthStore()
        if (authStore.isAuthenticated) {
          const { items } = await cartApi.addToCart({ bookId, quantity, price })
          this.setItems(items)
        } else {
          this.addLocalItem({ bookId, quantity, price })
        }
      })
    },
    
    async removeFromCart(itemId) {
      return handleAsyncAction(this, async () => {
        const response = await cartApi.removeFromCart(itemId)
        this.setItems(response.items)
      })
    },
    
    async updateQuantity(payload) {
      return handleAsyncAction(this, async () => {
        const authStore = useAuthStore()
        if (authStore.isAuthenticated) {
          const response = await cartApi.updateQuantity(payload.itemId, payload.quantity)
          if (response && response.items) {
            this.setItems(response.items)
          }
        } else {
          this.updateLocalQuantity(payload)
        }
      })
    },
    
    async clearCart() {
      return handleAsyncAction(this, async () => {
        await cartApi.clearCart()
        this.items = []
        localStorage.removeItem('cart')
      })
    },
    
    async syncCart() {
      return handleAsyncAction(this, async () => {
        const localCart = JSON.parse(localStorage.getItem('cart')) || []
        const response = await cartApi.syncCart(localCart)
        
        if (response?.items) {
          this.setItems(response.items)
          localStorage.removeItem('cart')
        } else {
          throw new Error('Failed to sync cart')
        }
      })
    },
    
    // Вспомогательные методы для управления состоянием
    setItems(items) {
      this.items = items || []
      localStorage.setItem('cart', JSON.stringify(this.items))
    },
    
    addLocalItem(item) {
      const existingItem = this.items.find(
        i => i.bookId?._id === item.bookId?._id || i.bookId === item.bookId
      )
      if (existingItem) {
        existingItem.quantity += item.quantity
      } else {
        this.items.push(item)
      }
      localStorage.setItem('cart', JSON.stringify(this.items))
    },
    
    updateLocalQuantity({ bookId, quantity }) {
      const item = this.items.find((i) => i.bookId === bookId)
      if (item) {
        item.quantity = quantity
      }
      localStorage.setItem('cart', JSON.stringify(this.items))
    }
  }
})