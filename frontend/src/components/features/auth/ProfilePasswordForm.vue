<template>
    <v-form aria-labelledby="password-title" @submit.prevent="save">
        <h2 id="password-title" class="text-h5 mb-4">{{ t('profile.passwordTitle') }}</h2>
        <v-alert v-if="summary" ref="summaryAlert" type="error" tabindex="-1" class="mb-4">{{ summary }}</v-alert>
        <v-text-field
            id="profile-current-password"
            v-model="currentPassword"
            :label="t('profile.currentPassword')"
            :aria-label="t('profile.currentPassword')"
            :type="showCurrent ? 'text' : 'password'"
            autocomplete="current-password"
            maxlength="1024"
            :disabled="busy"
            :error-messages="errors.currentPassword"
            :aria-invalid="errors.currentPassword ? 'true' : undefined"
        >
            <template #append-inner>
                <v-btn
                    type="button"
                    variant="text"
                    size="small"
                    :icon="showCurrent ? 'mdi-eye-off' : 'mdi-eye'"
                    :aria-label="t(showCurrent ? 'profile.hideCurrent' : 'profile.showCurrent')"
                    :aria-pressed="showCurrent"
                    :disabled="busy"
                    @mousedown.stop
                    @click.stop="showCurrent = !showCurrent"
                />
            </template>
        </v-text-field>
        <v-text-field
            id="profile-new-password"
            v-model="newPassword"
            :label="t('profile.newPassword')"
            :aria-label="t('profile.newPassword')"
            :type="showNew ? 'text' : 'password'"
            autocomplete="new-password"
            :hint="t('profile.passwordHint')"
            persistent-hint
            :disabled="busy"
            :error-messages="errors.newPassword"
            :aria-invalid="errors.newPassword ? 'true' : undefined"
        >
            <template #append-inner>
                <v-btn
                    type="button"
                    variant="text"
                    size="small"
                    :icon="showNew ? 'mdi-eye-off' : 'mdi-eye'"
                    :aria-label="t(showNew ? 'profile.hideNew' : 'profile.showNew')"
                    :aria-pressed="showNew"
                    :disabled="busy"
                    @mousedown.stop
                    @click.stop="showNew = !showNew"
                />
            </template>
        </v-text-field>
        <v-btn type="submit" color="primary" class="mt-4" :loading="saving" :disabled="busy">
            {{ t('profile.changePassword') }}
            <template #loader
                ><v-progress-circular indeterminate size="24" :aria-label="t('common.loading')"
            /></template>
        </v-btn>
    </v-form>
</template>

<script setup>
import { computed, nextTick, onScopeDispose, reactive, ref } from 'vue'
import { t } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { passwordErrorKey, passwordLengthIssue } from '@/utils/passwordRules'
import { resolveErrorKey } from '@/utils/errorResolver'

const auth = useAuthStore()
const currentPassword = ref('')
const newPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const saving = ref(false)
const busy = computed(() => saving.value || auth.accountBusy)
const errors = reactive({ currentPassword: '', newPassword: '' })
const summary = ref('')
const summaryAlert = ref(null)
let disposed = false
onScopeDispose(() => {
    disposed = true
})
async function showSummary(message) {
    if (disposed) return
    summary.value = message
    await nextTick()
    if (!disposed) summaryAlert.value?.$el?.focus()
}
async function save() {
    if (busy.value) return
    errors.currentPassword = currentPassword.value ? '' : t('auth.rules.passwordRequired')
    const issue = passwordLengthIssue(newPassword.value)
    errors.newPassword = issue ? t(passwordErrorKey(issue)) : ''
    if (errors.currentPassword || errors.newPassword) return showSummary(t('profile.summary'))
    saving.value = true
    summary.value = ''
    try {
        const result = await auth.changePassword({
            currentPassword: currentPassword.value,
            newPassword: newPassword.value,
        })
        if (disposed || !result) return
        currentPassword.value = ''
        newPassword.value = ''
        showCurrent.value = false
        showNew.value = false
    } catch (failure) {
        if (disposed) return
        for (const [field, code] of Object.entries(failure.fields ?? {}))
            if (Object.hasOwn(errors, field)) errors[field] = t(passwordErrorKey(code))
        await showSummary(t(failure.fields ? 'profile.summary' : resolveErrorKey(failure)))
    } finally {
        if (!disposed) saving.value = false
    }
}
</script>

<style scoped>
:deep(.v-input--disabled .v-input__details) {
    opacity: 1;
}
</style>
