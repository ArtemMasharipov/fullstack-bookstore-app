<template>
    <div>
        <v-row v-if="cart.status === 'idle' || cart.status === 'loading'">
            <v-col cols="12" md="8">
                <v-skeleton-loader v-for="n in 2" :key="n" type="list-item-avatar-three-line" class="mb-4" />
            </v-col>
            <v-col cols="12" md="4">
                <v-skeleton-loader type="article, button" />
            </v-col>
        </v-row>

        <error-message v-else-if="cart.status === 'error'" :code="errorCode" :on-retry="cart.load" :closable="false" />

        <v-alert v-else-if="cart.isEmpty" type="info" variant="tonal" icon="mdi-cart-off">
            {{ t('cart.empty') }}
            <div class="mt-2">
                <v-btn variant="text" :to="localeRoute('Books')" prepend-icon="mdi-book-open-page-variant-outline">
                    {{ t('cart.browse') }}
                </v-btn>
            </div>
        </v-alert>

        <v-row v-else>
            <v-col cols="12" md="8">
                <cart-item v-for="line in cart.lines" :key="line.bookId" :line="line" />
            </v-col>
            <v-col cols="12" md="4">
                <cart-summary :quote="cart.quote" />
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { localeRoute } from '@/router/locale'
import { useCartStore } from '@/stores'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import CartItem from './CartItem.vue'
import CartSummary from './CartSummary.vue'

const { t } = useI18n()
const cart = useCartStore()

// The store keeps the error as a dictionary key; ErrorMessage takes the code
const errorCode = computed(() => cart.error?.replace(/^errors\./, ''))

// Prices may have changed since the cart was loaded
onMounted(() => cart.load())
</script>
