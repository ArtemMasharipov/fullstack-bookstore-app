<template>
    <div>
        <!-- Global Dialog System -->
        <v-dialog v-model="dialogVisible" :max-width="getDialogWidth" persistent @click:outside="closeOnClickOutside">
            <component
                :is="dynamicComponent"
                v-if="dialogVisible && dialogType"
                v-bind="dialogData"
                @close="closeDialog"
            />
        </v-dialog>
    </div>
</template>

<script setup>
import { useDialog } from '@/composables/useDialog'
import { computed } from 'vue'

/**
 * DialogLayout component for handling app-level dialogs
 * Now uses useDialog composable instead of ui store (ЭТАП 2)
 */

// Dialog composable
const { dialog, closeDialog } = useDialog()

// Computed properties
const dialogVisible = computed(() => dialog.value.visible)
const dialogType = computed(() => dialog.value.type)
const dialogData = computed(() => dialog.value.data)

/**
 * Dynamically load dialog components based on the dialog type
 */
const dynamicComponent = computed(() => {
    if (!dialogType.value) return null

    // Map dialog types to components - can be expanded as needed
    const componentMap = {
        confirm: () => import('@/components/ui/ConfirmModal.vue'),
        // Add more mappings as needed
    }

    // Return the component or a fallback
    return componentMap[dialogType.value] || null
})

/**
 * Get appropriate width for different dialog types
 */
const getDialogWidth = computed(() => {
    const widthMap = {
        confirm: '500px',
        form: '600px',
        info: '400px',
        alert: '350px',
    }
    return widthMap[dialogType.value] || '500px'
})

// Methods
/**
 * Handle closing dialog when clicking outside
 */
const closeOnClickOutside = () => {
    // Allow closing by outside click only for certain dialog types
    const allowOutsideClose = ['info', 'alert']

    if (allowOutsideClose.includes(dialogType.value)) {
        closeDialog()
    }
}
</script>
