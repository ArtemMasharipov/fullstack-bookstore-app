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
        {{ message }}
    </v-alert>
</template>

<script setup>
/**
 * Generic message component for displaying alerts
 * Wraps Vuetify v-alert with common defaults
 */

defineProps({
    message: {
        type: String,
        required: true,
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
</script>
