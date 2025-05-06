<template>
    <v-card class="mb-4">
        <v-row no-gutters>
            <v-col cols="12" sm="3" md="2">
                <v-img
                    :src="bookImage"
                    :alt="bookTitle"
                    @error="handleImageError"
                    height="160"
                    cover
                    class="rounded-s-md h-100"
                ></v-img>
            </v-col>
            
            <v-col cols="12" sm="7" md="8">
                <v-card-item>
                    <v-card-title>{{ bookTitle }}</v-card-title>
                    <v-card-subtitle class="pt-2">
                        Price: ${{ formattedPrice }}
                    </v-card-subtitle>
                    
                    <div class="d-flex align-center mt-2">
                        <v-btn-toggle
                            v-model="quantity"
                            density="comfortable"
                            mandatory
                            class="border rounded"
                        >
                            <v-btn
                                icon="mdi-minus"
                                density="compact"
                                :disabled="item.quantity <= 1"
                                @click="handleQuantityClick(item.quantity - 1)"
                            ></v-btn>
                            
                            <v-card class="d-flex justify-center align-center px-2">
                                <span>{{ item.quantity }}</span>
                            </v-card>
                            
                            <v-btn
                                icon="mdi-plus"
                                density="compact"
                                @click="handleQuantityClick(item.quantity + 1)"
                            ></v-btn>
                        </v-btn-toggle>
                    </div>
                </v-card-item>
            </v-col>
            
            <v-col cols="12" sm="2" md="2" class="d-flex align-center justify-end pe-4">
                <v-btn
                    color="error"
                    variant="text"
                    prepend-icon="mdi-delete"
                    @click="remove"
                >
                    Remove
                </v-btn>
            </v-col>
        </v-row>
    </v-card>
</template>

<script>
import placeholderImage from '@/assets/images/placeholder.png';
import { useCartStore } from '@/stores';
import { debounce } from 'lodash';

export default {
    name: 'CartItem',
    props: {
        item: {
            type: Object,
            required: true,
            validator: ({ bookId, quantity, price }) => 
                bookId && Number.isFinite(quantity) && Number.isFinite(price)
        }
    },
    emits: ['error', 'update-quantity'],
    
    data() {
        return {
            quantity: null
        };
    },
    
    computed: {
        cartStore() {
            return useCartStore();
        },
        bookTitle() {
            const { title = 'Unknown Book' } = this.item.bookId || {};
            return title;
        },
        bookImage() {
            return this.item?.bookId?.image || placeholderImage;
        },
        formattedPrice() {
            return Number(this.item.price).toFixed(2);
        }
    },
    
    created() {
        this.handleQuantityClick = debounce(this.updateQuantityInCart, 300);
    },
    
    methods: {
        async remove() {
            try {
                await this.cartStore.removeFromCart(this.item._id);
            } catch (error) {
                this.$emit('error', error.message);
            }
        },
        
        handleImageError(e) {
            e.target.src = placeholderImage;
        },
        
        updateQuantityInCart(quantity) {
            if (quantity >= 1) {
                this.$emit('update-quantity', { 
                    bookId: this.item.bookId._id, 
                    quantity 
                });
                
                this.cartStore.updateQuantity({ 
                    bookId: this.item.bookId._id, 
                    quantity 
                }).catch(error => {
                    this.$emit('error', error.message);
                });
            }
        }
    }
}
</script>
