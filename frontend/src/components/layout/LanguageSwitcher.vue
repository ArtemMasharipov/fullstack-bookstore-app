<template>
    <div role="group" :aria-label="t('language.label')" class="d-flex ga-1">
        <button
            v-for="language in languages"
            :key="language.locale"
            type="button"
            :lang="language.locale"
            :aria-label="t(language.labelKey)"
            :aria-pressed="routeLocale(route) === language.locale"
            class="language-button"
            @click="router.push(switchLocaleTarget(route, language.locale))"
        >
            {{ language.text }}
        </button>
    </div>
</template>

<script setup>
import { t } from '@/i18n'
import { routeLocale, switchLocaleTarget } from '@/router/locale'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const languages = [
    { locale: 'cs', labelKey: 'language.cs', text: 'CS' },
    { locale: 'en', labelKey: 'language.en', text: 'EN' },
]
</script>

<style scoped>
.language-button {
    color: inherit;
    padding: 0.25rem 0.5rem;
    min-height: 44px;
    min-width: 44px;
    border: 1px solid currentColor;
    border-radius: 4px;
    font: inherit;
    cursor: pointer;
}

.language-button[aria-pressed='true'] {
    font-weight: bold;
    text-decoration: underline;
    text-underline-offset: 0.25em;
}

.language-button:focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 2px;
}
</style>
