<template>
  <v-container class="checkout">
    <v-card class="mx-auto" max-width="800px">
      <v-card-title class="text-h4 mb-2">Checkout</v-card-title>
      
      <v-card-text v-if="loading" class="text-center py-5">
        <loading-spinner />
      </v-card-text>
      
      <v-card-text v-else-if="error">
        <error-message :message="error" />
      </v-card-text>
      
      <template v-else>
        <v-card-text>
          <v-sheet class="pa-4 mb-4 rounded border">
            <div class="text-h6 mb-3">Order Summary</div>
            
            <v-list density="compact" class="pa-0 bg-transparent">
              <v-list-item
                v-for="item in cartItems" 
                :key="item.id"
                :title="item.title"
              >
                <template v-slot:append>
                  {{ item.quantity }} x ${{ item.price }}
                </template>
              </v-list-item>
            </v-list>
            
            <v-divider class="my-2"></v-divider>
            
            <div class="d-flex justify-end font-weight-bold text-body-1">
              Total: ${{ cartTotal }}
            </div>
          </v-sheet>
          
          <v-form @submit.prevent="submitOrder">
            <v-textarea
              id="address"
              v-model="orderData.address"
              label="Shipping Address"
              variant="outlined"
              rows="3"
              required
            ></v-textarea>
            
            <v-text-field
              id="phone"
              v-model="orderData.phone"
              label="Phone Number"
              variant="outlined"
              type="tel"
              required
            ></v-text-field>
            
            <v-btn
              type="submit"
              color="primary"
              block
              :disabled="loading"
              size="large"
              class="mt-4"
            >
              Place Order
            </v-btn>
          </v-form>
        </v-card-text>
      </template>
    </v-card>
  </v-container>
</template>

<script>
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useCartStore, useOrdersStore } from '@/stores'

export default {
  name: 'CheckoutView',
  components: {
    LoadingSpinner,
    ErrorMessage
  },
  data() {
    return {
      orderData: {
        address: '',
        phone: ''
      }
    }
  },
  computed: {
    cartStore() {
      return useCartStore()
    },
    ordersStore() {
      return useOrdersStore()
    },
    cartItems() {
      return this.cartStore.cartItems
    },
    cartTotal() {
      return this.cartStore.cartTotal
    },
    loading() {
      return this.cartStore.loading
    },
    error() {
      return this.cartStore.error
    }
  },
  methods: {
    async submitOrder() {
      try {
        const order = await this.ordersStore.createOrder({
          ...this.orderData,
          items: this.cartItems,
          total: this.cartTotal
        })
        this.$router.push(`/orders/${order._id}`)
      } catch (error) {
        console.error('Failed to create order:', error)
      }
    }
  }
}
</script>
