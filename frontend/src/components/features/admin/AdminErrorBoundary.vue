<template>
    <div>
        <div v-if="error" class="admin-error-boundary">
            <v-card color="error" theme="dark" class="mx-auto my-8" max-width="600">
                <v-card-title class="text-h5">
                    <v-icon icon="mdi-alert" class="mr-2"></v-icon>
                    Error in Admin Panel
                </v-card-title>
                <v-card-text>
                    <p class="text-subtitle-1">
                        An unexpected error occurred. This could be due to missing or invalid data in the admin view.
                    </p>
                    <v-alert
                        color="white"
                        variant="tonal"
                        class="mt-4"
                        icon="mdi-code-json"
                        :title="errorInfo ? errorInfo.componentName : 'Unknown component'"
                        density="compact"
                        border
                    >
                        <pre class="error-message">{{ errorMessage }}</pre>
                    </v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="white" variant="tonal" @click="handleReset">
                        <v-icon start icon="mdi-refresh"></v-icon>
                        Reset View
                    </v-btn>
                    <v-btn color="white" variant="tonal" @click="navigateToDashboard">
                        <v-icon start icon="mdi-view-dashboard"></v-icon>
                        Go to Dashboard
                    </v-btn>
                </v-card-actions>
            </v-card>
        </div>
        <slot v-else></slot>
    </div>
</template>

<script>
import { toast } from '@/store'

export default {
    name: 'AdminErrorBoundary',

    data() {
        return {
            error: null,
            errorInfo: null,
            errorMessage: '',
        }
    },

    errorCaptured(err, instance, info) {
        // Capture errors only in production
        if (process.env.NODE_ENV === 'production') {
            this.error = err
            this.errorMessage = err.message || 'Unknown error'

            // Get component information
            this.errorInfo = {
                componentName: instance?.type?.name || 'Unknown Component',
                info: info,
            }

            // Log error for debugging
            console.error('Error captured in AdminErrorBoundary:', err)
            console.info('Component:', instance?.type?.name)
            console.info('Error Info:', info)

            return false // Stop error propagation
        }

        // In development, let the error propagate for better debugging
        return true
    },

    methods: {
        handleReset() {
            this.error = null
            this.errorInfo = null
            this.errorMessage = ''
            toast.info('View has been reset')
        },

        navigateToDashboard() {
            this.error = null
            this.errorInfo = null
            this.errorMessage = ''
            this.$router.push('/admin')
        },
    },
}
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
