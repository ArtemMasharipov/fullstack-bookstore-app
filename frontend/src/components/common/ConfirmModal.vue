<template>
    <v-dialog
        v-model="localDialog"
        max-width="400px"
        @click:outside="$emit('cancel')"
    >
        <v-card>
            <v-card-title>{{ title }}</v-card-title>
            
            <v-card-text>
                {{ message }}
            </v-card-text>
            
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    variant="outlined"
                    color="grey"
                    @click="$emit('cancel')"
                >
                    {{ cancelText }}
                </v-btn>
                <v-btn
                    color="error"
                    @click="$emit('confirm')"
                >
                    {{ confirmText }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: 'ConfirmModal',
    props: {
        title: {
            type: String,
            default: 'Confirm Action'
        },
        message: {
            type: String,
            required: true
        },
        confirmText: {
            type: String,
            default: 'Confirm'
        },
        cancelText: {
            type: String,
            default: 'Cancel'
        },
        modelValue: {
            type: Boolean,
            default: true
        }
    },
    emits: ['confirm', 'cancel', 'update:modelValue'],
    computed: {
        localDialog: {
            get() {
                return this.modelValue;
            },
            set(value) {
                if (!value) {
                    this.$emit('cancel');
                }
            }
        }
    }
}
</script>
