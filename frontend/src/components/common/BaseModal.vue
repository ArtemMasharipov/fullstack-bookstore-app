<template>
    <v-dialog
        v-model="dialog"
        :max-width="maxWidth"
        @click:outside="$emit('close')"
    >
        <v-card class="modal-container">
            <slot></slot>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: 'BaseModal',
    props: {
        size: {
            type: String,
            default: 'medium',
            validator: (value) => ['small', 'medium', 'large'].includes(value)
        },
        modelValue: {
            type: Boolean,
            default: true
        }
    },
    emits: ['close', 'update:modelValue'],
    computed: {
        dialog: {
            get() {
                return this.modelValue;
            },
            set(value) {
                if (!value) {
                    this.$emit('close');
                    this.$emit('update:modelValue', value);
                }
            }
        },
        maxWidth() {
            const sizes = {
                small: '400px',
                medium: '600px',
                large: '800px'
            };
            return sizes[this.size];
        }
    }
}
</script>

<style scoped>
.modal-container {
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
}
</style>
