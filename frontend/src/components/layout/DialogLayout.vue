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
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/store'

/**
 * DialogLayout component for handling app-level dialogs
 * Note: Toast notifications are now handled by the Toast component
 */

// Store setup
const uiStore = useUiStore()

// Reactive state extraction
const { dialogVisible, dialogType, dialogData } = storeToRefs(uiStore)

// Computed properties
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
        alert: '350px'
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
        uiStore.closeDialog()
    }
}

/**
 * Close dialog method
 */
const closeDialog = () => {
    uiStore.closeDialog()
}
</script>