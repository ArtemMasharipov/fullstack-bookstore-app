<template>
    <v-dialog
        v-model="localDialog"
        :max-width="maxWidth"
        :persistent="persistent"
        @click:outside="handleCancel"
    >
        <v-card>
            <v-card-title>
                <v-icon v-if="icon" :icon="icon" class="me-2" :color="iconColor"></v-icon>
                {{ title }}
            </v-card-title>
            
            <v-card-text>
                <slot name="content">
                    {{ message }}
                </slot>
            </v-card-text>
            
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    :variant="cancelVariant"
                    :color="cancelColor"
                    @click="handleCancel"
                    :disabled="loading"
                >
                    {{ cancelText }}
                </v-btn>
                
                <v-btn
                    :color="confirmColor"
                    @click="handleConfirm"
                    :loading="loading"
                >
                    {{ confirmText }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
/**
 * Reusable confirmation dialog component
 * Used for confirming destructive actions or important decisions
 */
export default {
    name: 'ConfirmModal',
    props: {
        /**
         * Title of the modal
         */
        title: {
            type: String,
            default: 'Confirm Action'
        },
        /**
         * Message content
         */
        message: {
            type: String,
            required: true
        },
        /**
         * Text for the confirm button
         */
        confirmText: {
            type: String,
            default: 'Confirm'
        },
        /**
         * Text for the cancel button
         */
        cancelText: {
            type: String,
            default: 'Cancel'
        },
        /**
         * Controls modal visibility (v-model)
         */
        modelValue: {
            type: Boolean,
            default: false
        },
        /**
         * Maximum width of the modal
         */
        maxWidth: {
            type: [String, Number],
            default: '400px'
        },
        /**
         * Makes the dialog stay open when clicking outside
         */
        persistent: {
            type: Boolean,
            default: false
        },
        /**
         * Icon to show in the modal title
         */
        icon: {
            type: String,
            default: 'mdi-alert'
        },
        /**
         * Icon color
         */
        iconColor: {
            type: String,
            default: 'warning'
        },
        /**
         * Color for the confirmation button
         */
        confirmColor: {
            type: String,
            default: 'error'
        },
        /**
         * Color for the cancel button
         */
        cancelColor: {
            type: String,
            default: 'grey'
        },
        /**
         * Variant for cancel button
         */
        cancelVariant: {
            type: String,
            default: 'outlined'
        }
    },
    emits: ['confirm', 'cancel', 'update:modelValue'],
    data() {
        return {
            loading: false
        }
    },
    computed: {
        localDialog: {
            get() {
                return this.modelValue;
            },
            set(value) {
                if (!value) {
                    this.handleCancel();
                }
                this.$emit('update:modelValue', value);
            }
        }
    },
    methods: {
        /**
         * Handle confirmation action
         */
        handleConfirm() {
            this.$emit('confirm');
            this.$emit('update:modelValue', false);
        },
        
        /**
         * Handle cancel action
         */
        handleCancel() {
            this.$emit('cancel');
            this.$emit('update:modelValue', false);
        }
    }
}
</script>
