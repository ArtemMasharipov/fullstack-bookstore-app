<template>
    <v-alert
        v-if="message"
        type="error"
        variant="tonal"
        closable
        class="mb-4"
        @close="$emit('close')"
    >
        {{ message }}
    </v-alert>
</template>

<script>
export default {
    name: 'ErrorMessage',
    props: {
        message: {
            type: String,
            required: true
        }
    },
    emits: ['close']
}
</script>