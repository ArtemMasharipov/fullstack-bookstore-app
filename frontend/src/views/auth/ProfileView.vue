<template>
    <v-container class="py-8 profile-page">
        <h1 class="text-h4 font-weight-bold mb-2">{{ t('profile.title') }}</h1>
        <p class="mb-6">{{ t('profile.description') }}</p>
        <v-progress-linear v-if="loading" indeterminate :aria-label="t('profile.loading')" />
        <v-alert v-if="loadError" type="error">
            <p>{{ t(resolveErrorKey(loadError)) }}</p>
            <v-btn class="mt-3" variant="outlined" :disabled="loading" @click="load">{{ t('errors.retry') }}</v-btn>
        </v-alert>
        <template v-if="loaded">
            <v-card class="pa-4 pa-sm-6 mb-6">
                <v-form aria-labelledby="profile-details-title" @submit.prevent="save">
                    <h2 id="profile-details-title" class="text-h5 mb-4">{{ t('profile.detailsTitle') }}</h2>
                    <v-alert v-if="summary" ref="summaryAlert" type="error" tabindex="-1" class="mb-4">{{
                        summary
                    }}</v-alert>
                    <v-text-field
                        v-for="field in FIELDS"
                        :id="'profile-' + field"
                        :key="field"
                        v-model="form[field]"
                        :label="t('profile.' + field)"
                        :aria-label="t('profile.' + field)"
                        :autocomplete="AUTOCOMPLETE[field]"
                        maxlength="50"
                        :disabled="busy"
                        :error-messages="errors[field]"
                        :aria-invalid="errors[field] ? 'true' : undefined"
                    />
                    <dl class="mb-4">
                        <dt class="font-weight-bold">{{ t('profile.email') }}</dt>
                        <dd class="profile-email">{{ email }}</dd>
                    </dl>
                    <p class="text-body-2 mb-4">{{ t('profile.emailHint') }}</p>
                    <v-btn type="submit" color="primary" :loading="saving" :disabled="busy || !dirty || !valid">
                        {{ t('profile.save') }}
                        <template #loader
                            ><v-progress-circular indeterminate size="24" :aria-label="t('common.loading')"
                        /></template>
                    </v-btn>
                </v-form>
            </v-card>
            <v-card class="pa-4 pa-sm-6 mb-6"><ProfilePasswordForm /></v-card>
            <div class="d-flex flex-wrap ga-4">
                <v-btn :to="localeRoute('Orders')" variant="outlined">{{ t('profile.orders') }}</v-btn>
                <v-btn :disabled="busy" :loading="signingOut" variant="outlined" @click="logoutAll">
                    {{ t('profile.logoutAll') }}
                    <template #loader
                        ><v-progress-circular indeterminate size="24" :aria-label="t('common.loading')"
                    /></template>
                </v-btn>
            </div>
        </template>
    </v-container>
</template>

<script setup>
import { computed, nextTick, onMounted, onScopeDispose, reactive, ref } from 'vue'
import ProfilePasswordForm from '@/components/features/auth/ProfilePasswordForm.vue'
import { t } from '@/i18n'
import { localeRoute } from '@/router/locale'
import { useAuthStore } from '@/stores/auth'
import { resolveErrorKey } from '@/utils/errorResolver'

const auth = useAuthStore()
const FIELDS = ['firstName', 'lastName', 'username']
const AUTOCOMPLETE = { firstName: 'given-name', lastName: 'family-name', username: 'username' }
const form = reactive({ firstName: '', lastName: '', username: '' })
const original = reactive({ ...form })
const errors = reactive({})
const email = ref('')
const loaded = ref(false)
const loading = ref(false)
const loadError = ref(null)
const saving = ref(false)
const signingOut = ref(false)
const summary = ref('')
const summaryAlert = ref(null)
const busy = computed(() => saving.value || signingOut.value || auth.accountBusy)
const dirty = computed(() => FIELDS.some((field) => form[field] !== original[field]))
const valid = computed(() => FIELDS.every((field) => !issue(field)))
let disposed = false
onScopeDispose(() => {
    disposed = true
})
function setProfile(user) {
    for (const field of FIELDS) form[field] = original[field] = user[field] ?? ''
    email.value = user.email
}
function issue(field) {
    const value = form[field].trim()
    if (field === 'username') return /^[a-zA-Z0-9_-]{3,50}$/.test(value) ? '' : t('profile.usernameError')
    return value.length > 50 ? t('profile.nameError') : ''
}
async function showSummary(message) {
    if (disposed) return
    summary.value = message
    await nextTick()
    if (!disposed) summaryAlert.value?.$el?.focus()
}
async function load() {
    if (loading.value) return
    loading.value = true
    loadError.value = null
    try {
        const user = await auth.loadProfile()
        if (disposed || !user) return
        setProfile(user)
        loaded.value = true
    } catch (failure) {
        if (!disposed) loadError.value = failure
    } finally {
        if (!disposed) loading.value = false
    }
}
async function save() {
    if (busy.value || !dirty.value) return
    for (const field of FIELDS) errors[field] = issue(field)
    if (!valid.value) return showSummary(t('profile.summary'))
    const body = Object.fromEntries(
        FIELDS.filter((field) => form[field] !== original[field]).map((field) => [field, form[field].trim()])
    )
    saving.value = true
    summary.value = ''
    try {
        const user = await auth.updateProfile(body)
        if (!disposed && user) setProfile(user)
    } catch (failure) {
        if (disposed) return
        for (const [field, code] of Object.entries(failure.fields ?? {}))
            if (FIELDS.includes(field))
                errors[field] = t(
                    code === 'duplicate'
                        ? 'profile.duplicate'
                        : field === 'username'
                        ? 'profile.usernameError'
                        : 'profile.nameError'
                )
        await showSummary(t(failure.fields ? 'profile.summary' : resolveErrorKey(failure)))
    } finally {
        if (!disposed) saving.value = false
    }
}
async function logoutAll() {
    if (busy.value) return
    signingOut.value = true
    try {
        await auth.logoutAll()
    } catch (failure) {
        await showSummary(t(resolveErrorKey(failure)))
    } finally {
        if (!disposed) signingOut.value = false
    }
}
onMounted(load)
</script>

<style scoped>
.profile-page {
    max-width: 800px;
}
.profile-email {
    overflow-wrap: anywhere;
}
</style>
