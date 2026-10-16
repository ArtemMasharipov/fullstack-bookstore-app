<template>
    <v-form novalidate @submit.prevent="onSubmit">
        <!-- Not a live region: it updates while the customer types; the focus announces it after a submit -->
        <div
            v-if="problems.length"
            ref="summary"
            class="checkout-errors mb-4 pa-3 rounded"
            tabindex="-1"
            role="group"
            aria-labelledby="checkout-errors-title"
        >
            <p id="checkout-errors-title" class="font-weight-bold mb-1">{{ t('checkout.errorSummary') }}</p>
            <ul class="pl-4">
                <li v-for="problem in problems" :key="problem.field">
                    <a :href="`#checkout-${problem.field}`" @click.prevent="focusField(problem.field)">
                        {{ problem.label }}: {{ problem.message }}
                    </a>
                </li>
            </ul>
        </div>

        <p class="text-body-2 text-medium-emphasis mb-3">{{ t('checkout.requiredNote') }}</p>

        <v-text-field
            v-for="field in FIELDS"
            :id="`checkout-${field}`"
            :key="field"
            v-model="address[field]"
            :label="t(`checkout.fields.${field}`)"
            :autocomplete="AUTOCOMPLETE[field]"
            :type="field === 'phone' ? 'tel' : 'text'"
            :inputmode="field === 'postalCode' ? 'numeric' : undefined"
            :hint="HINTS.includes(field) ? t(`checkout.hints.${field}`) : undefined"
            :error-messages="messages[field] ? [messages[field]] : []"
            :aria-invalid="messages[field] ? 'true' : 'false'"
            :aria-label="t(`checkout.fields.${field}`)"
            aria-required="true"
            class="mb-2"
        />

        <v-text-field
            id="checkout-country"
            :model-value="t('checkout.countryName')"
            :label="t('checkout.fields.country')"
            :aria-label="t('checkout.fields.country')"
            :hint="t('checkout.countryHint')"
            autocomplete="country-name"
            persistent-hint
            readonly
            class="mb-4"
        />

        <p class="text-body-2 text-medium-emphasis mb-4">{{ t('checkout.paymentNote') }}</p>

        <v-btn
            ref="submitButton"
            type="submit"
            color="primary"
            size="large"
            block
            :loading="submitting"
            :disabled="submitting || blocked"
            prepend-icon="mdi-check-circle-outline"
        >
            {{ t('checkout.submit') }}
        </v-btn>
    </v-form>
</template>

<script setup>
import { ADDRESS_RULES, SHIPPING_COUNTRY, validateAddress } from '@/utils/address'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
    /** Fields the server rejected: { "shippingAddress.<field>": "<code>" } */
    fields: { type: Object, default: () => ({}) },
    submitting: { type: Boolean, default: false },
    /** The cart cannot be ordered as it is */
    blocked: { type: Boolean, default: false },
})
// edit: the customer changed the address, so an earlier request no longer matches the screen
const emit = defineEmits(['submit', 'edit'])

const FIELDS = ['fullName', 'line1', 'city', 'postalCode', 'phone']
const AUTOCOMPLETE = {
    fullName: 'name',
    line1: 'address-line1',
    city: 'address-level2',
    postalCode: 'postal-code',
    phone: 'tel',
}
const HINTS = ['postalCode', 'phone']
const KNOWN_CODES = ['required', 'too_small', 'too_big', 'invalid_format', 'invalid_value']

const { t } = useI18n()
const address = reactive(Object.fromEntries(FIELDS.map((field) => [field, ''])))
const clientErrors = ref({})
const attempted = ref(false)
const summary = ref(null)
const submitButton = ref(null)

const serverErrors = computed(() => {
    const prefix = 'shippingAddress.'
    return Object.fromEntries(
        Object.entries(props.fields)
            .filter(([path]) => path.startsWith(prefix))
            .map(([path, code]) => [path.slice(prefix.length), code])
    )
})

function messageOf(field, code) {
    if (code === 'invalid_format' && HINTS.includes(field)) return t(`checkout.fieldFormats.${field}`)
    if (code === 'too_small') return t('checkout.fieldErrors.too_small', { min: ADDRESS_RULES[field].min })
    if (code === 'too_big') return t('checkout.fieldErrors.too_big', { max: ADDRESS_RULES[field].max })
    return t(`checkout.fieldErrors.${KNOWN_CODES.includes(code) ? code : 'invalid_type'}`)
}

const messages = computed(() => {
    const codes = { ...serverErrors.value, ...clientErrors.value }
    return Object.fromEntries(
        FIELDS.filter((field) => codes[field]).map((field) => [field, messageOf(field, codes[field])])
    )
})

const problems = computed(() =>
    FIELDS.filter((field) => messages.value[field]).map((field) => ({
        field,
        label: t(`checkout.fields.${field}`),
        message: messages.value[field],
    }))
)

const filledAddress = () => ({
    ...Object.fromEntries(FIELDS.map((field) => [field, address[field].trim()])),
    country: SHIPPING_COUNTRY,
})

async function focusSummary() {
    await nextTick()
    summary.value?.focus()
}

// A link to an id only moves the reading position; the customer needs the cursor in the field
const focusField = (field) => document.getElementById(`checkout-${field}`)?.focus()

function onSubmit() {
    if (props.submitting || props.blocked) return
    attempted.value = true
    clientErrors.value = validateAddress(filledAddress())
    if (Object.keys(clientErrors.value).length) return focusSummary()
    emit('submit', filledAddress())
}

// Once the customer has tried to order, problems go away as they are fixed
watch(address, () => {
    if (attempted.value) clientErrors.value = validateAddress(filledAddress())
    emit('edit')
})

watch(serverErrors, (errors) => {
    if (Object.keys(errors).length) focusSummary()
})

defineExpose({
    /** Gives the focus back to the order button, for example after a dialog closed */
    focusSubmit: () => submitButton.value?.$el.focus(),
})
</script>

<style scoped>
.checkout-errors {
    border: 2px solid rgb(var(--v-theme-error));
    overflow-wrap: anywhere;
}

/* Each link is a target of its own: at least 24 px high (WCAG 2.5.8) */
.checkout-errors a {
    display: inline-block;
    min-height: 24px;
    padding-block: 2px;
}
</style>
