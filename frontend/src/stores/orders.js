import { orderApi } from '@/api/orderApi'
import { defineStore } from 'pinia'
import { useCartStore } from './cart'
import { handleAsyncAction } from './utils/stateHelpers'

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [],
    currentOrder: null,
    loading: false,
    error: null
  }),
  
  getters: {
    ordersList: (state) => state.orders,
    currentOrder: (state) => state.currentOrder,
    loading: (state) => state.loading,
    error: (state) => state.error
  },
  
  actions: {
    async createOrder(orderData) {
      return handleAsyncAction(this, async () => {
        const order = await orderApi.createOrder(orderData)
        this.orders.unshift(order)
        
        // Очистка корзины после создания заказа
        const cartStore = useCartStore()
        await cartStore.clearCart()
        
        return order
      })
    },
    
    async fetchOrders() {
      return handleAsyncAction(this, async () => {
        const orders = await orderApi.getOrders()
        this.orders = orders
        return orders
      })
    },
    
    async fetchOrderById(id) {
      return handleAsyncAction(this, async () => {
        const order = await orderApi.getOrderById(id)
        this.currentOrder = order
        return order
      })
    },
    
    async updateOrderStatus({ id, status }) {
      return handleAsyncAction(this, async () => {
        const updatedOrder = await orderApi.updateOrderStatus(id, status)
        const order = this.orders.find(o => o._id === id)
        if (order) {
          order.status = updatedOrder.status
        }
        return updatedOrder
      })
    },
    
    async cancelOrder(id) {
      return handleAsyncAction(this, async () => {
        const updatedOrder = await orderApi.cancelOrder(id)
        const order = this.orders.find(o => o._id === id)
        if (order) {
          order.status = updatedOrder.status
        }
        return updatedOrder
      })
    }
  }
})