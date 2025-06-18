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
import { useUiStore } from '@/store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

/**
 * GlobalUI component for handling app-level UI elements like dialogs
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
        confirm: '400px',
    }

    return widthMap[dialogType.value] || '500px'
})

// Methods
const closeDialog = () => {
    uiStore.closeDialog()
}

/**
 * Handle outside clicks - dialog will close only if it's not marked as persistent
 */
const closeOnClickOutside = () => {
    // Dialog data can specify if clicking outside should close the dialog
    if (dialogData.value && dialogData.value.persistent === false) {
        closeDialog()
    }
}
</script>
