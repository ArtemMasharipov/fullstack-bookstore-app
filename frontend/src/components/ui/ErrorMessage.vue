<template>
    <v-alert
        :type="type"
        :variant="variant"
        :color="color"
        :closable="closable"
        :class="classes"
        @click:close="$emit('close')"
        :icon="icon"
        :density="density"
        border
    >
        {{ safeMessage }}
        <div class="mt-3 d-flex ga-2">
            <v-btn v-if="onRetry" variant="text" @click="onRetry()">{{ t('errors.retry') }}</v-btn>
            <v-btn variant="text" @click="showContact = true">{{ t('errors.contact') }}</v-btn>
        </div>
        <p v-if="showContact" role="status" class="mt-2">{{ t('errors.supportUnavailable') }}</p>
    </v-alert>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveErrorKey } from '@/utils/errorResolver'
const { t } = useI18n()
const showContact = ref(false)
/**
 * Generic message component for displaying alerts
 * Wraps Vuetify v-alert with common defaults
 */

const props = defineProps({
    error: Object,
    code: String,
    onRetry: Function,
    message: {
        type: String,
        default: undefined,
    },
    type: {
        type: String,
        default: 'error',
        validator: (val) => ['success', 'info', 'warning', 'error'].includes(val),
    },
    variant: {
        type: String,
        default: 'tonal',
        validator: (val) => ['flat', 'tonal', 'outlined', 'text', 'elevated'].includes(val),
    },
    color: {
        type: String,
        default: null,
    },
    closable: {
        type: Boolean,
        default: true,
    },
    classes: {
        type: [String, Array, Object],
        default: 'mb-4',
    },
    icon: {
        type: String,
        default: undefined,
    },
    density: {
        type: String,
        default: 'comfortable',
        validator: (val) => ['default', 'comfortable', 'compact'].includes(val),
    },
})

defineEmits(['close'])
const safeMessage = computed(() => t(resolveErrorKey(props.code ? { code: props.code } : props.error)))
</script>
