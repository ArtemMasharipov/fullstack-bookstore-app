<template>
    <v-dialog
        :model-value="modelValue"
        max-width="640"
        scrollable
        :aria-labelledby="titleId"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <v-card>
            <v-card-title :id="titleId" class="text-h6 text-wrap">
                {{ t(book ? 'admin.bookForm.editTitle' : 'admin.bookForm.createTitle') }}
            </v-card-title>

            <v-form @submit.prevent="save">
                <v-card-text>
                    <v-alert v-if="summary" ref="summaryAlert" type="error" class="mb-4" tabindex="-1">
                        {{ summary }}
                    </v-alert>
                    <v-alert v-if="authorsFailed" type="warning" class="mb-4">
                        {{ t('admin.bookForm.authorsError') }}
                        <v-btn variant="text" :disabled="authorsLoading" @click="loadAuthors">{{
                            t('errors.retry')
                        }}</v-btn>
                    </v-alert>

                    <v-text-field
                        v-model="form.title"
                        :label="t('admin.bookForm.title')"
                        :error-messages="errors.title"
                        :aria-invalid="errors.title ? 'true' : undefined"
                        maxlength="100"
                    />
                    <v-autocomplete
                        v-model="form.authorId"
                        :label="t('admin.bookForm.author')"
                        :items="authorOptions"
                        :loading="authorsLoading"
                        :error-messages="errors.authorId"
                        :aria-invalid="errors.authorId ? 'true' : undefined"
                    >
                        <template #loader="{ color, isActive }">
                            <v-progress-linear
                                :active="isActive"
                                :color="color"
                                height="2"
                                indeterminate
                                :aria-label="t('common.loading')"
                            />
                        </template>
                    </v-autocomplete>
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-text-field
                                v-model="form.publicationYear"
                                type="number"
                                :label="t('admin.bookForm.year')"
                                :error-messages="errors.publicationYear"
                                :aria-invalid="errors.publicationYear ? 'true' : undefined"
                            />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field
                                v-model="form.price"
                                type="number"
                                step="0.01"
                                min="0"
                                :label="t('common.priceLabel', { currency: 'CZK' })"
                                :error-messages="errors.price"
                                :aria-invalid="errors.price ? 'true' : undefined"
                            />
                        </v-col>
                    </v-row>
                    <v-select
                        v-model="form.category"
                        :label="t('admin.bookForm.category')"
                        :open-text="t('admin.bookForm.category')"
                        :close-text="t('admin.bookForm.category')"
                        :items="BOOK_CATEGORIES"
                        :error-messages="errors.category"
                        :aria-invalid="errors.category ? 'true' : undefined"
                    />
                    <v-textarea
                        v-model="form.description"
                        :label="t('admin.bookForm.description')"
                        :error-messages="errors.description"
                        :aria-invalid="errors.description ? 'true' : undefined"
                        rows="3"
                        auto-grow
                        counter="1000"
                    />
                    <v-text-field
                        v-model="form.image"
                        type="url"
                        :label="t('admin.bookForm.image')"
                        :error-messages="errors.image"
                        :aria-invalid="errors.image ? 'true' : undefined"
                    />
                    <v-switch
                        v-model="form.inStock"
                        :label="t('admin.bookForm.inStock')"
                        color="primary"
                        inset
                        hide-details
                    />
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="close">{{ t('modal.cancel') }}</v-btn>
                    <v-btn
                        type="submit"
                        variant="elevated"
                        :loading="saving"
                        :disabled="authorsFailed || authorsLoading"
                    >
                        {{ t('admin.form.save') }}
                    </v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { useReturnFocus } from '@/composables/useReturnFocus'
import { t } from '@/i18n'
import { authorsApi } from '@/services/api/authorsApi'
import { booksApi } from '@/services/api/booksApi'
import { BOOK_CATEGORIES } from '@/utils/constants/app'
import { resolveErrorKey } from '@/utils/errorResolver'
import { nextTick, reactive, ref, useId, watch } from 'vue'

/**
 * Creates a book (book is null) or replaces the one it is given. The fields follow the API's rules, so most mistakes
 * show before anything is sent; what the API still refuses shows at its field, with a summary on top that takes
 * focus. A failed save keeps the dialog and what was typed.
 */

const props = defineProps({
    modelValue: Boolean,
    book: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const FIELDS = ['title', 'authorId', 'publicationYear', 'category', 'description', 'price', 'image']
const DATA_IMAGE = /^data:image\/(png|jpeg|webp|svg\+xml)[;,]/

const titleId = `book-form-${useId()}`
const form = reactive({})
const errors = reactive({})
const summary = ref('')
const summaryAlert = ref(null)
const saving = ref(false)
const authorOptions = ref([])
const authorsLoading = ref(false)
const authorsFailed = ref(false)
const returnFocus = useReturnFocus()

const currentYear = () => new Date().getFullYear()
const isPrice = (value) => {
    const price = Number(value)
    return (
        Number.isFinite(price) &&
        price >= 0 &&
        price <= 999999.99 &&
        Math.abs(Math.round(price * 100) - price * 100) < 1e-6
    )
}
const isImage = (value) => DATA_IMAGE.test(value) || (/^https:\/\/\S+$/.test(value) && value.length <= 2048)

// The rule of each field, as one message: shown when the field breaks it, here or at the API
const RULES = {
    title: () => t('admin.form.errors.length', { min: 2, max: 100 }),
    authorId: () => t('admin.form.errors.required'),
    publicationYear: () => t('admin.form.errors.range', { min: 1450, max: currentYear() }),
    category: () => t('admin.form.errors.required'),
    description: () => t('admin.form.errors.maxLength', { max: 1000 }),
    price: () => t('admin.form.errors.price'),
    image: () => t('admin.form.errors.image'),
}

// The message for a field's value, or '' when it is valid
function check(field) {
    const value = String(form[field] ?? '').trim()
    if (['title', 'authorId', 'publicationYear', 'category', 'price'].includes(field) && !value) {
        return t('admin.form.errors.required')
    }
    const broken = {
        title: () => value.length < 2 || value.length > 100,
        authorId: () => false,
        publicationYear: () => !/^\d+$/.test(value) || Number(value) < 1450 || Number(value) > currentYear(),
        category: () => false,
        description: () => value.length > 1000,
        price: () => !isPrice(value),
        image: () => value !== '' && !isImage(value),
    }[field]()
    return broken ? RULES[field]() : ''
}

// What the API answered for a field: a code of its own, or the field's rule
function serverMessage(field, code) {
    if (code === 'duplicate') return t('admin.form.errors.duplicateBook')
    if (field === 'authorId' && code === 'not_found') return t('admin.form.errors.authorNotFound')
    return RULES[field]?.() ?? t('admin.form.errors.invalid')
}

// The request body: the API's types, and no empty optional field
function body() {
    const description = form.description.trim()
    const image = form.image.trim()
    return {
        title: form.title.trim(),
        authorId: form.authorId,
        publicationYear: Number(form.publicationYear),
        category: form.category,
        ...(description && { description }),
        price: Number(form.price),
        ...(image && { image }),
        inStock: form.inStock,
    }
}

function reset() {
    const book = props.book
    Object.assign(form, {
        title: book?.title ?? '',
        authorId: book?.author?.id ?? null,
        publicationYear: book ? String(book.publicationYear) : '',
        category: book?.category ?? null,
        description: book?.description ?? '',
        price: book ? String(book.price) : '',
        image: book?.image ?? '',
        inStock: book?.inStock ?? true,
    })
    for (const field of FIELDS) errors[field] = ''
    summary.value = ''
}

async function loadAuthors() {
    authorsLoading.value = true
    authorsFailed.value = false
    try {
        const response = await authorsApi.fetchAll({ limit: 100, sortBy: 'lastName' })
        const options = (response.data ?? []).map((author) => ({
            value: author.id,
            title: `${author.lastName}, ${author.firstName}`,
        }))
        // The book's own author stays selectable even beyond the first 100
        const own = props.book?.author
        if (own && !options.some((option) => option.value === own.id)) {
            options.unshift({ value: own.id, title: `${own.lastName}, ${own.firstName}` })
        }
        authorOptions.value = options
    } catch {
        authorsFailed.value = true
    } finally {
        authorsLoading.value = false
    }
}

async function showSummary(message) {
    summary.value = message
    await nextTick()
    summaryAlert.value?.$el?.focus()
}

async function save() {
    if (saving.value || authorsLoading.value || authorsFailed.value) return
    for (const field of FIELDS) errors[field] = check(field)
    if (FIELDS.some((field) => errors[field])) return showSummary(t('admin.form.summary'))

    saving.value = true
    summary.value = ''
    try {
        const response = props.book ? await booksApi.update(props.book.id, body()) : await booksApi.create(body())
        emit('saved', response.data, !props.book)
        close()
    } catch (error) {
        if (error?.fields) {
            for (const [field, code] of Object.entries(error.fields)) errors[field] = serverMessage(field, code)
            await showSummary(t('admin.form.summary'))
        } else {
            await showSummary(t(resolveErrorKey(error)))
        }
    } finally {
        saving.value = false
    }
}

function close() {
    emit('update:modelValue', false)
}

watch(
    () => props.modelValue,
    async (open) => {
        if (open) {
            returnFocus.remember()
            reset()
            loadAuthors()
        } else {
            await nextTick()
            returnFocus.restore()
        }
    },
    { immediate: true }
)
</script>
