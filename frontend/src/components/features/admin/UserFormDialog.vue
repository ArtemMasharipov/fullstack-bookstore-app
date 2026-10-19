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
                {{ t(user ? 'admin.userForm.editTitle' : 'admin.userForm.createTitle') }}
            </v-card-title>
            <v-form @submit.prevent="save">
                <v-card-text>
                    <v-progress-linear
                        v-if="loading"
                        indeterminate
                        :aria-label="t('admin.userForm.loading')"
                        class="mb-4"
                    />
                    <v-alert v-if="loadError" type="error" class="mb-4">
                        <p>{{ t(resolveErrorKey(loadError)) }}</p>
                        <v-btn variant="outlined" class="mt-2" @click="loadFresh">{{ t('errors.retry') }}</v-btn>
                    </v-alert>
                    <v-alert v-if="summary" ref="summaryAlert" type="error" class="mb-4" tabindex="-1">{{
                        summary
                    }}</v-alert>
                    <v-text-field
                        v-for="field in TEXT_FIELDS"
                        :key="field"
                        v-model="form[field]"
                        :label="t(`admin.userForm.${field}`)"
                        :type="field === 'email' ? 'email' : 'text'"
                        :maxlength="field === 'email' ? 254 : 50"
                        :autocomplete="AUTOCOMPLETE[field]"
                        :disabled="busy || !loaded"
                        :error-messages="errors[field]"
                        :aria-invalid="errors[field] ? 'true' : undefined"
                    />
                    <v-select
                        v-model="form.role"
                        :items="roleOptions"
                        :label="t('admin.userForm.role')"
                        :open-text="t('admin.userForm.role')"
                        :close-text="t('admin.userForm.role')"
                        :disabled="busy || !loaded || isSelf"
                        :error-messages="errors.role"
                        :aria-invalid="errors.role ? 'true' : undefined"
                    />
                    <p v-if="isSelf" class="mb-4">{{ t('admin.userForm.selfHint') }}</p>
                    <v-text-field
                        v-if="!user"
                        v-model="form.password"
                        :label="t('admin.userForm.password')"
                        type="password"
                        autocomplete="new-password"
                        maxlength="1024"
                        :hint="t('admin.userForm.passwordHint')"
                        persistent-hint
                        :disabled="busy"
                        :error-messages="errors.password"
                        :aria-invalid="errors.password ? 'true' : undefined"
                    />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="emit('update:modelValue', false)">{{ t('modal.cancel') }}</v-btn>
                    <v-btn type="submit" :loading="saving" :disabled="busy || !loaded">{{
                        t('admin.form.save')
                    }}</v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, nextTick, onScopeDispose, reactive, ref, useId, watch } from 'vue'
import { useReturnFocus } from '@/composables/useReturnFocus'
import { t } from '@/i18n'
import { usersApi } from '@/services/api/usersApi'
import { resolveErrorKey } from '@/utils/errorResolver'

const props = defineProps({ modelValue: Boolean, user: { type: Object, default: null }, isSelf: Boolean })
const emit = defineEmits(['update:modelValue', 'saved'])
const TEXT_FIELDS = ['username', 'email', 'firstName', 'lastName']
const FIELDS = [...TEXT_FIELDS, 'role', 'password']
const AUTOCOMPLETE = { username: 'username', email: 'email', firstName: 'given-name', lastName: 'family-name' }
const titleId = `user-form-${useId()}`
const form = reactive({})
const errors = reactive({})
const summary = ref('')
const summaryAlert = ref(null)
const loading = ref(false)
const loadError = ref(null)
const loaded = ref(false)
const saving = ref(false)
const busy = computed(() => loading.value || saving.value)
const roleOptions = computed(() => ['user', 'admin'].map((value) => ({ value, title: t(`admin.roles.${value}`) })))
const returnFocus = useReturnFocus()
let generation = 0
let disposed = false
const active = (attempt) => !disposed && props.modelValue && attempt === generation

function setForm(user) {
    for (const field of TEXT_FIELDS) form[field] = user?.[field] ?? ''
    form.role = user?.role ?? 'user'
    form.password = ''
    for (const field of FIELDS) errors[field] = ''
    summary.value = ''
}

async function loadFresh() {
    if (loading.value || !props.user || !props.modelValue) return
    const attempt = generation
    const id = props.user.id
    loading.value = true
    loadError.value = null
    try {
        const user = await usersApi.get(id)
        if (!active(attempt)) return
        setForm(user)
        loaded.value = true
    } catch (failure) {
        if (active(attempt)) loadError.value = failure
    } finally {
        if (active(attempt)) loading.value = false
    }
}

function message(field, code) {
    if (code === 'duplicate') return t('admin.userForm.duplicate')
    if (['username', 'email', 'password'].includes(field)) return t(`admin.userForm.${field}Error`)
    if (['firstName', 'lastName'].includes(field)) return t('admin.form.errors.maxLength', { max: 50 })
    return t('admin.form.errors.invalid')
}

function check(field) {
    const value = String(form[field] ?? '')
    if (field === 'username' && !/^[a-zA-Z0-9_-]{3,50}$/.test(value.trim())) return message(field)
    if (field === 'email' && (value.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())))
        return message(field)
    if (field === 'password' && !props.user && (value.length < 6 || value.length > 1024)) return message(field)
    if (['firstName', 'lastName'].includes(field) && value.trim().length > 50) return message(field)
    if (field === 'role' && !['user', 'admin'].includes(value)) return message(field)
    return ''
}

async function showSummary(text, attempt) {
    if (!active(attempt)) return
    summary.value = text
    await nextTick()
    if (active(attempt)) summaryAlert.value?.$el?.focus()
}

async function save() {
    if (busy.value || !loaded.value || !props.modelValue) return
    const attempt = generation
    for (const field of FIELDS) errors[field] = check(field)
    if (FIELDS.some((field) => errors[field])) return showSummary(t('admin.form.summary'), attempt)
    const user = props.user
    const body = { username: form.username.trim(), email: form.email.trim().toLowerCase(), role: form.role }
    for (const field of ['firstName', 'lastName']) if (user || form[field].trim()) body[field] = form[field].trim()
    if (!user) body.password = form.password
    saving.value = true
    summary.value = ''
    try {
        const response = user ? await usersApi.update(user.id, body) : await usersApi.create(body)
        if (disposed) return
        emit('saved', response, !user)
        if (active(attempt)) emit('update:modelValue', false)
    } catch (failure) {
        if (!active(attempt)) return
        if (failure.fields) {
            for (const [field, code] of Object.entries(failure.fields)) {
                if (FIELDS.includes(field)) errors[field] = message(field, code)
            }
            await showSummary(t('admin.form.summary'), attempt)
        } else await showSummary(t(resolveErrorKey(failure)), attempt)
    } finally {
        if (attempt === generation) saving.value = false
    }
}

watch(
    [() => props.modelValue, () => props.user],
    async ([open, user], previous) => {
        const attempt = ++generation
        saving.value = false
        loading.value = false
        loadError.value = null
        loaded.value = !user
        if (open) {
            if (!previous?.[0]) returnFocus.remember()
            setForm(user)
            if (user) loadFresh()
        } else {
            await nextTick()
            if (attempt === generation && !props.modelValue) returnFocus.restore()
        }
    },
    { immediate: true }
)
onScopeDispose(() => {
    disposed = true
    generation++
})
</script>
