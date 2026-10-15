<template>
    <v-card variant="outlined" class="cart-line mb-4">
        <div class="d-flex ga-4 pa-4">
            <v-img
                :src="line.image || placeholderImage"
                alt=""
                width="72"
                height="108"
                cover
                class="flex-grow-0 flex-shrink-0 rounded"
            />

            <div class="cart-line__body flex-grow-1">
                <h2 class="text-subtitle-1 font-weight-bold">{{ title }}</h2>
                <p v-if="line.authorName" class="text-body-2 text-medium-emphasis">{{ line.authorName }}</p>

                <template v-if="line.available">
                    <p class="text-body-2 mt-1">
                        {{ formatMoney(line.unitPrice) }}
                        <v-chip size="x-small" color="success" variant="tonal" class="ms-2">
                            {{ t('cart.inStock') }}
                        </v-chip>
                    </p>
                    <div class="d-flex align-center ga-2 mt-2" role="group" :aria-label="t('cart.quantity')">
                        <v-btn
                            icon="mdi-minus"
                            variant="outlined"
                            :aria-label="t('cart.decrease', { title })"
                            v-bind="inactive(!canDecrease)"
                            @click="canDecrease && cart.setQuantity(line.bookId, line.quantity - 1)"
                        />
                        <span class="cart-line__quantity text-body-1" aria-live="polite">{{ line.quantity }}</span>
                        <v-btn
                            icon="mdi-plus"
                            variant="outlined"
                            :aria-label="t('cart.increase', { title })"
                            v-bind="inactive(!canIncrease)"
                            @click="canIncrease && cart.setQuantity(line.bookId, line.quantity + 1)"
                        />
                    </div>
                    <p class="text-subtitle-1 font-weight-bold mt-2">{{ formatMoney(line.lineTotal) }}</p>
                </template>
                <p v-else class="text-error mt-1">{{ t(`cart.unavailable.${line.unavailableReason}`) }}</p>
            </div>

            <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                class="flex-shrink-0"
                :aria-label="t('cart.remove', { title })"
                v-bind="inactive(busy)"
                @click="confirming = !busy"
            />
        </div>

        <confirm-modal
            v-model="confirming"
            :message="t('cart.removeConfirm', { title })"
            @confirm="cart.remove(line.bookId)"
        />
    </v-card>
</template>

<script setup>
import placeholderImage from '@/assets/images/placeholder.svg'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useCartStore } from '@/stores'
import { formatMoney } from '@/utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const MAX_QUANTITY = 99

const props = defineProps({
    /** A cart line as the server answers it: { bookId, title, unitPrice, quantity, lineTotal, available, ... } */
    line: {
        type: Object,
        required: true,
    },
})

const { t } = useI18n()
const cart = useCartStore()
const confirming = ref(false)

// A deleted book has no title any more; the reason stands in for it
const title = computed(() => props.line.title ?? t('cart.unavailable.DELETED'))
// Changes wait for the server; meanwhile the line takes no other action
const busy = computed(() => cart.pending.includes(props.line.bookId))
const canDecrease = computed(() => !busy.value && props.line.quantity > 1)
const canIncrease = computed(() => !busy.value && props.line.quantity < MAX_QUANTITY)

// An inactive button stays focusable: a native disabled button would drop
// the keyboard focus after every change. Its clicks are ignored instead.
const inactive = (off) => ({ 'aria-disabled': String(off), class: { 'cart-line__control--off': off } })
</script>

<style scoped>
.cart-line__body {
    min-width: 0;
    overflow-wrap: anywhere;
}

.cart-line__quantity {
    min-width: 2ch;
    text-align: center;
}

.cart-line__control--off {
    opacity: 0.38;
    cursor: not-allowed;
}
</style>
