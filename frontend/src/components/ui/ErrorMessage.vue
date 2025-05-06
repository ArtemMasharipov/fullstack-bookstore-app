<template>
    <v-alert
        v-if="message"
        :type="type"
        :variant="variant"
        :color="color"
        :closable="closable"
        :class="classes"
        @close="$emit('close')"
        :icon="icon"
        :density="density"
        border
    >
        <slot>
            {{ message }}
        </slot>
    </v-alert>
</template>

<script setup>
/**
 * Generic message component for displaying alerts
 * Wraps Vuetify v-alert with common defaults
 */

/**
 * Props definition for ErrorMessage
 */
defineProps({
    /**
     * The message text to display
     */
    message: {
        type: String,
        required: true,
    },
    /**
     * Alert type from Vuetify options
     */
    type: {
        type: String,
        default: 'error',
        validator: (val) => ['success', 'info', 'warning', 'error'].includes(val),
    },
    /**
     * Visual variant style
     */
    variant: {
        type: String,
        default: 'tonal',
        validator: (val) => ['flat', 'tonal', 'outlined', 'text', 'elevated'].includes(val),
    },
    /**
     * Custom color override (uses type color by default)
     */
    color: {
        type: String,
        default: null,
    },
    /**
     * Whether user can close the alert
     */
    closable: {
        type: Boolean,
        default: true,
    },
    /**
     * Additional CSS classes
     */
    classes: {
        type: [String, Array, Object],
        default: 'mb-4',
    },
    /**
     * Custom icon (uses default for type if not specified)
     */
    icon: {
        type: String,
        default: undefined,
    },
    /**
     * Controls the alert's padding density
     */
    density: {
        type: String,
        default: 'comfortable',
        validator: (val) => ['default', 'comfortable', 'compact'].includes(val),
    },
})

/**
 * Events emitted by this component
 */
defineEmits(['close'])
</script>
