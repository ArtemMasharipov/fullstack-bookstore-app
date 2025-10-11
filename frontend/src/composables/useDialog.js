import { ref } from 'vue'

/**
 * Simple dialog state management composable
 * Replaces ui store for dialog functionality (ЭТАП 2)
 */

// Global dialog state (shared across components)
const dialog = ref({
    visible: false,
    type: null,
    data: null,
})

export function useDialog() {
    const openDialog = (type, data = null) => {
        dialog.value = {
            visible: true,
            type,
            data,
        }
    }

    const closeDialog = () => {
        dialog.value = {
            visible: false,
            type: null,
            data: null,
        }
    }

    return {
        dialog,
        dialogVisible: () => dialog.value.visible,
        dialogType: () => dialog.value.type,
        dialogData: () => dialog.value.data,
        openDialog,
        closeDialog,
    }
}
