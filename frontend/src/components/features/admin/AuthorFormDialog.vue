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
                {{ t(author ? 'admin.authorForm.editTitle' : 'admin.authorForm.createTitle') }}
            </v-card-title>
            <v-form @submit.prevent="save">
                <v-card-text>
                    <v-alert v-if="summary" ref="summaryAlert" type="error" class="mb-4" tabindex="-1">{{
                        summary
                    }}</v-alert>
                    <v-text-field
                        v-for="field in TEXT_FIELDS"
                        :key="field"
                        v-model="form[field]"
                        :label="t(`admin.authorForm.${field}`)"
                        :type="field === 'birthYear' ? 'number' : field === 'website' ? 'url' : 'text'"
                        :maxlength="LIMITS[field]"
                        :min="field === 'birthYear' ? 1000 : undefined"
                        :step="field === 'birthYear' ? 1 : undefined"
                        :autocomplete="
                            field === 'firstName' ? 'given-name' : field === 'lastName' ? 'family-name' : undefined
                        "
                        :disabled="saving"
                        :error-messages="errors[field]"
                        :aria-invalid="errors[field] ? 'true' : undefined"
                    />
                    <v-textarea
                        v-model="form.bio"
                        :label="t('admin.authorForm.bio')"
                        :disabled="saving"
                        :error-messages="errors.bio"
                        :aria-invalid="errors.bio ? 'true' : undefined"
                        rows="3"
                        auto-grow
                        counter="2000"
                    />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="close">{{ t('modal.cancel') }}</v-btn>
                    <v-btn type="submit" :loading="saving" :disabled="saving">{{ t('admin.form.save') }}</v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { useReturnFocus } from '@/composables/useReturnFocus'
import { t } from '@/i18n'
import { authorsApi } from '@/services/api/authorsApi'
import { resolveErrorKey } from '@/utils/errorResolver'
import { nextTick, onScopeDispose, reactive, ref, useId, watch } from 'vue'

const props = defineProps({ modelValue: Boolean, author: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'saved'])
const TEXT_FIELDS = ['firstName', 'lastName', 'birthYear', 'country', 'website']
const FIELDS = [...TEXT_FIELDS, 'bio']
const LIMITS = { firstName: 50, lastName: 50, country: 100, website: 2048, bio: 2000 }
const titleId = `author-form-${useId()}`
const form = reactive({})
const errors = reactive({})
const summary = ref('')
const summaryAlert = ref(null)
const saving = ref(false)
const returnFocus = useReturnFocus()
let generation = 0
let disposed = false
const currentYear = () => new Date().getFullYear()

function check(field) {
    const value = String(form[field] ?? '').trim()
    if (['firstName', 'lastName'].includes(field)) {
        if (!value) return t('admin.form.errors.required')
        if (value.length < 2 || value.length > 50) return t('admin.form.errors.length', { min: 2, max: 50 })
    } else if (field === 'birthYear') {
        if (value && (!/^\d+$/.test(value) || Number(value) < 1000 || Number(value) > currentYear())) {
            return t('admin.form.errors.range', { min: 1000, max: currentYear() })
        }
    } else {
        if (value.length > LIMITS[field]) return t('admin.form.errors.maxLength', { max: LIMITS[field] })
        if (field === 'website' && value) {
            try {
                if (['http:', 'https:'].includes(new URL(value).protocol)) return ''
            } catch {
                /* Show the same translated rule for malformed addresses. */
            }
            return t('admin.form.errors.website')
        }
    }
    return ''
}

function serverMessage(field, code) {
    if (code === 'duplicate') return t('admin.form.errors.duplicateAuthor')
    if (field === 'birthYear') return t('admin.form.errors.range', { min: 1000, max: currentYear() })
    if (['firstName', 'lastName'].includes(field)) return t('admin.form.errors.length', { min: 2, max: 50 })
    if (code === 'too_big') return t('admin.form.errors.maxLength', { max: LIMITS[field] })
    if (field === 'website') return t('admin.form.errors.website')
    return t('admin.form.errors.invalid')
}

function reset() {
    for (const field of FIELDS) {
        form[field] = String(props.author?.[field] ?? '')
        errors[field] = ''
    }
    summary.value = ''
}

function body() {
    const result = { firstName: form.firstName.trim(), lastName: form.lastName.trim() }
    for (const field of ['bio', 'birthYear', 'country', 'website']) {
        const value = form[field].trim()
        if (value) result[field] = field === 'birthYear' ? Number(value) : value
    }
    return result
}

async function showSummary(message, attempt = generation) {
    summary.value = message
    await nextTick()
    if (attempt === generation && props.modelValue) summaryAlert.value?.$el?.focus()
}

async function save() {
    if (saving.value || !props.modelValue) return
    for (const field of FIELDS) errors[field] = check(field)
    if (FIELDS.some((field) => errors[field])) return showSummary(t('admin.form.summary'))
    const attempt = generation
    const author = props.author
    saving.value = true
    summary.value = ''
    try {
        const response = author ? await authorsApi.update(author.id, body()) : await authorsApi.create(body())
        if (disposed) return
        // The write committed even if this opening was closed; only its own dialog state is stale.
        emit('saved', response.data, !author)
        if (attempt !== generation || !props.modelValue) return
        close()
    } catch (failure) {
        if (attempt !== generation || !props.modelValue) return
        if (failure.fields) {
            for (const [field, code] of Object.entries(failure.fields)) {
                if (FIELDS.includes(field)) errors[field] = serverMessage(field, code)
            }
            await showSummary(t('admin.form.summary'), attempt)
        } else await showSummary(t(resolveErrorKey(failure)), attempt)
    } finally {
        if (attempt === generation) saving.value = false
    }
}

function close() {
    emit('update:modelValue', false)
}
watch(
    () => props.modelValue,
    async (open) => {
        generation++
        saving.value = false
        if (open) {
            returnFocus.remember()
            reset()
        } else {
            await nextTick()
            returnFocus.restore()
        }
    },
    { immediate: true }
)
watch(
    () => props.author,
    () => {
        if (props.modelValue) {
            generation++
            saving.value = false
            reset()
        }
    }
)
onScopeDispose(() => {
    disposed = true
    generation++
})
</script>
