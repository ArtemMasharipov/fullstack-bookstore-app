<template>
    <v-dialog
        v-model="dialog"
        :max-width="maxWidth"
        :persistent="persistent"
        :content-class="contentClass"
        :transition="transition"
        :overlay-opacity="overlayOpacity"
        @click:outside="handleOutsideClick"
    >
        <v-card class="base-modal-container" :elevation="elevation">
            <v-card-title v-if="$slots.title || title" class="modal-title">
                <slot name="title">{{ title }}</slot>
                <v-btn
                    v-if="showCloseButton"
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    aria-label="Close dialog"
                    @click="close"
                    class="ml-auto"
                ></v-btn>
            </v-card-title>

            <v-divider v-if="$slots.title || title"></v-divider>

            <v-card-text :class="contentPadding">
                <slot></slot>
            </v-card-text>

            <v-divider v-if="$slots.actions"></v-divider>

            <v-card-actions v-if="$slots.actions">
                <slot name="actions"></slot>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

/**
 * Base modal component that serves as a foundation for all modals
 * Provides common functionality and styling for modal dialogs
 */

/**
 * Props definition
 */
const props = defineProps({
    /**
     * Controls the visibility of the modal (v-model)
     */
    modelValue: {
        type: Boolean,
        default: false,
    },
    /**
     * Predefined size of the modal
     */
    size: {
        type: String,
        default: 'medium',
        validator: (value) => ['small', 'medium', 'large', 'x-large', 'full'].includes(value),
    },
    /**
     * Custom width override (takes precedence over size)
     */
    width: {
        type: [String, Number],
        default: null,
    },
    /**
     * Title text to display in the modal header
     */
    title: {
        type: String,
        default: '',
    },
    /**
     * Whether clicking outside closes the modal
     */
    persistent: {
        type: Boolean,
        default: false,
    },
    /**
     * Whether to show the close button in the header
     */
    showCloseButton: {
        type: Boolean,
        default: true,
    },
    /**
     * Custom CSS class for the dialog content
     */
    contentClass: {
        type: String,
        default: '',
    },
    /**
     * CSS padding for the content area
     */
    contentPadding: {
        type: String,
        default: 'pa-4',
    },
    /**
     * Transition effect for the dialog
     */
    transition: {
        type: String,
        default: 'dialog-transition',
    },
    /**
     * Opacity of the overlay background
     */
    overlayOpacity: {
        type: [String, Number],
        default: 0.5,
    },
    /**
     * Card elevation level
     */
    elevation: {
        type: [String, Number],
        default: 4,
    },
})

/**
 * Events emitted by this component
 */
const emit = defineEmits(['close', 'update:modelValue'])

/**
 * Two-way binding for dialog visibility
 */
const dialog = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        if (!value) {
            close()
        }
    },
})

/**
 * Determine max width based on size prop or custom width
 */
const maxWidth = computed(() => {
    if (props.width) return props.width

    const sizes = {
        small: '400px',
        medium: '600px',
        large: '800px',
        'x-large': '1200px',
        full: '90vw',
    }
    return sizes[props.size] || sizes.medium
})

/**
 * Close the modal and emit events
 */
const close = () => {
    emit('update:modelValue', false)
    emit('close')
}

/**
 * Handle click outside the modal
 */
const handleOutsideClick = () => {
    if (!props.persistent) {
        close()
    }
}
</script>

<style scoped>
.base-modal-container {
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.modal-title {
    display: flex;
    align-items: center;
}
</style>
