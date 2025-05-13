<template>
    <base-modal v-model="showModal" :title="form._id ? 'Edit Author' : 'Add New Author'" @close="handleClose">
        <v-form ref="authorForm" @submit.prevent="handleSubmit" validate-on="submit lazy">
            <v-row>
                <v-col cols="12">
                    <v-text-field
                        id="name"
                        v-model="form.name"
                        label="Name"
                        variant="outlined"
                        density="comfortable"
                        :rules="nameRules"
                        required
                        autofocus
                    ></v-text-field>
                </v-col>

                <v-col cols="12">
                    <v-textarea
                        id="biography"
                        v-model="form.biography"
                        label="Biography"
                        variant="outlined"
                        auto-grow
                        rows="5"
                        counter
                        maxlength="1000"
                        :rules="biographyRules"
                        hint="Brief author biography (optional)"
                    ></v-textarea>
                </v-col>
            </v-row>

            <div v-if="errorMessage" class="mt-4">
                <error-message :message="errorMessage" @close="errorMessage = ''" />
            </div>
        </v-form>

        <template #actions>
            <v-spacer></v-spacer>

            <v-btn color="secondary" variant="text" @click="handleClose" :disabled="loading"> Cancel </v-btn>

            <v-btn color="primary" :loading="loading" :disabled="loading" @click="handleSubmit">
                {{ submitButtonText }}
            </v-btn>
        </template>
    </base-modal>
</template>

<script>
import BaseModal from '../common/BaseModal.vue'
import ErrorMessage from '../common/ErrorMessage.vue'
import { toast } from '@/stores'

/**
 * Author form component for creating and editing authors
 */
export default {
    name: 'AuthorForm',
    components: {
        BaseModal,
        ErrorMessage,
    },

    props: {
        /**
         * Initial author data for editing
         */
        initialData: {
            type: Object,
            default: () => ({
                _id: null,
                name: '',
                biography: '',
            }),
        },
        /**
         * Controls loading state of the form
         */
        loading: {
            type: Boolean,
            default: false,
        },
        /**
         * Controls visibility of the modal
         */
        modelValue: {
            type: Boolean,
            default: false,
        },
    },

    emits: ['submit', 'close', 'update:modelValue'],

    data() {
        return {
            form: { ...this.initialData },
            nameRules: [
                (v) => !!v || 'Name is required',
                (v) => (v && v.length >= 2) || 'Name must be at least 2 characters',
            ],
            biographyRules: [(v) => !v || v.length <= 1000 || 'Biography must be less than 1000 characters'],
            errorMessage: '',
        }
    },

    computed: {
        /**
         * Two-way binding for modal visibility
         */
        showModal: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            },
        },

        /**
         * Dynamic text for submit button
         */
        submitButtonText() {
            if (this.loading) return 'Saving...'
            return this.form._id ? 'Update Author' : 'Create Author'
        },
    },

    watch: {
        initialData: {
            handler(newData) {
                this.form = { ...newData }
                this.errorMessage = ''

                // Reset validation state when data changes
                if (this.$refs.authorForm) {
                    this.$refs.authorForm.resetValidation()
                }
            },
            deep: true,
        },
    },

    methods: {
        /**
         * Handle form submission with validation
         */
        async handleSubmit() {
            this.errorMessage = ''

            const { valid } = await this.$refs.authorForm.validate()

            if (valid) {
                try {
                    this.$emit('submit', { ...this.form })
                } catch (error) {
                    this.errorMessage = error.message || 'Failed to save author'
                    toast.error(this.errorMessage)
                }
            }
        },

        /**
         * Handle modal close
         */
        handleClose() {
            this.$emit('close')
            this.$emit('update:modelValue', false)

            // Reset form state
            if (this.$refs.authorForm) {
                this.$refs.authorForm.resetValidation()
            }
        },
    },
}
</script>
