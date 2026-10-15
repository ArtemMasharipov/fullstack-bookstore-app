<template>
    <div>
        <div v-if="error" class="admin-error-boundary">
            <v-card color="error" theme="dark" class="mx-auto my-8" max-width="600">
                <v-card-title class="text-h5">
                    <v-icon icon="mdi-alert" class="mr-2"></v-icon>
                    {{ t('errors.adminTitle') }}
                </v-card-title>
                <v-card-text>
                    <p class="text-subtitle-1">
                        {{ t('errors.UNKNOWN') }}
                    </p>
                    <v-alert
                        color="white"
                        variant="tonal"
                        class="mt-4"
                        icon="mdi-code-json"
                        :title="t('errors.adminTitle')"
                        density="compact"
                        border
                    >
                        <pre class="error-message">{{ t(resolveErrorKey(error)) }}</pre>
                    </v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="white" variant="tonal" @click="handleReset">
                        <v-icon start icon="mdi-refresh"></v-icon>
                        {{ t('errors.resetView') }}
                    </v-btn>
                    <v-btn color="white" variant="tonal" @click="navigateToDashboard">
                        <v-icon start icon="mdi-view-dashboard"></v-icon>
                        {{ t('errors.dashboard') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </div>
        <slot v-else></slot>
    </div>
</template>

<script setup>
import { localeRoute } from '@/router/locale'
import { ref, onErrorCaptured as registerErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveErrorKey } from '@/utils/errorResolver'
import { useRouter } from 'vue-router'

const { t } = useI18n()

// Router
const router = useRouter()

// Reactive data
const error = ref(null)
const errorInfo = ref(null)
const errorMessage = ref('')

// Error handling hook (equivalent to errorCaptured)
const onErrorCaptured = (err, instance, info) => {
    // Capture errors only in production
    if (process.env.NODE_ENV === 'production') {
        error.value = err
        errorMessage.value = err.message || 'Unknown error'

        // Get component information
        errorInfo.value = {
            componentName: instance?.type?.name || 'Unknown Component',
            info: info,
        }

        // Log error for debugging
        // Error captured in AdminErrorBoundary
        console.info('Component:', instance?.type?.name)
        console.info('Error Info:', info)

        return false // Stop error propagation
    }

    // In development, let the error propagate for better debugging
    return true
}

// Methods
const handleReset = () => {
    error.value = null
    errorInfo.value = null
    errorMessage.value = ''
}

const navigateToDashboard = () => {
    error.value = null
    errorInfo.value = null
    errorMessage.value = ''
    router.push(localeRoute('AdminDashboard'))
}

// Register the existing capture handler for real descendant errors.
registerErrorCaptured(onErrorCaptured)

// Define error captured lifecycle hook
defineExpose({
    onErrorCaptured,
})
</script>

<style scoped>
.admin-error-boundary {
    padding: 20px;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.error-message {
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 14px;
    overflow-x: auto;
    max-height: 150px;
    background: rgba(0, 0, 0, 0.1);
    padding: 8px;
    border-radius: 4px;
}
</style>
