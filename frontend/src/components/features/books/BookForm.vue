<template>
    <base-modal
        v-model="showModal"
        :title="isEdit ? 'Update Book' : 'Create New Book'"
        size="large"
        persistent
        @close="handleClose"
    >
        <v-form ref="bookForm" @submit.prevent="handleSubmit" enctype="multipart/form-data" validate-on="submit lazy">
            <v-row>
                <v-col cols="12">
                    <v-text-field
                        id="title"
                        v-model="form.title"
                        label="Title"
                        variant="outlined"
                        :rules="titleRules"
                        required
                        autofocus
                    ></v-text-field>
                </v-col>

                <v-col cols="12">
                    <v-select
                        id="author"
                        v-model="form.authorId"
                        :items="authors"
                        item-title="name"
                        item-value="_id"
                        label="Author"
                        variant="outlined"
                        required
                        :rules="authorRules"
                        :hint="!authors.length ? 'No authors available. Please add an author first.' : ''"
                        persistent-hint
                    ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field
                        id="year"
                        v-model="form.publicationYear"
                        label="Publication Year"
                        variant="outlined"
                        type="number"
                        :rules="publicationYearRules"
                        required
                    ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field
                        id="category"
                        v-model="form.category"
                        label="Category"
                        variant="outlined"
                    ></v-text-field>
                </v-col>

                <v-col cols="12">
                    <v-textarea
                        id="description"
                        v-model="form.description"
                        label="Description"
                        variant="outlined"
                        rows="4"
                        :rules="descriptionRules"
                        auto-grow
                    ></v-textarea>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field
                        id="price"
                        v-model.number="form.price"
                        label="Price (грн)"
                        variant="outlined"
                        type="number"
                        step="0.01"
                        min="0"
                        :rules="priceRules"
                        required
                    ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                    <v-switch
                        v-model="form.inStock"
                        label="In Stock"
                        color="success"
                        hide-details
                        density="compact"
                        inset
                    ></v-switch>
                </v-col>

                <v-col cols="12">
                    <v-card variant="outlined" class="pa-4">
                        <v-card-title class="pl-0 pt-0">Book Cover</v-card-title>

                        <input
                            ref="fileInput"
                            type="file"
                            accept="image/*"
                            style="display: none"
                            @change="handleImageUpload"
                        />

                        <v-card-text class="pa-0">
                            <v-row v-if="!hasImage" align="center">
                                <v-col cols="12" class="py-2">
                                    <v-btn
                                        color="primary"
                                        variant="elevated"
                                        prepend-icon="mdi-cloud-upload"
                                        @click="triggerFileInput"
                                    >
                                        {{ isEdit ? 'Change Image' : 'Upload Image' }}
                                    </v-btn>
                                </v-col>
                            </v-row>

                            <v-row v-else align="center" class="mt-0">
                                <v-col cols="12" md="8" class="py-2">
                                    <v-chip closable class="text-body-2" @click:close="removeImage">
                                        {{ imageFileName }}
                                    </v-chip>
                                </v-col>

                                <v-col cols="12" md="4" class="text-end py-2">
                                    <v-btn variant="text" color="primary" size="small" @click="triggerFileInput">
                                        Change
                                    </v-btn>
                                </v-col>
                            </v-row>

                            <v-row v-if="hasImage">
                                <v-col cols="12" sm="6" md="4">
                                    <v-img
                                        :src="currentPreviewUrl"
                                        :alt="imageFileName || 'Preview'"
                                        class="rounded"
                                        height="200"
                                        cover
                                    ></v-img>
                                </v-col>
                            </v-row>

                            <v-alert
                                v-if="fileConfig.error"
                                type="error"
                                variant="tonal"
                                class="mt-3"
                                density="compact"
                            >
                                {{ fileConfig.error }}
                            </v-alert>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="mt-4"
                density="compact"
                closable
                @click:close="errorMessage = ''"
            >
                {{ errorMessage }}
            </v-alert>
        </v-form>

        <template #actions>
            <v-spacer></v-spacer>

            <v-btn color="secondary" variant="text" :disabled="isSubmitting" @click="handleClose"> Cancel </v-btn>

            <v-btn
                color="primary"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                @click="handleSubmit"
                :prepend-icon="isEdit ? 'mdi-content-save' : 'mdi-plus'"
            >
                {{ submitButtonText }}
            </v-btn>
        </template>
    </base-modal>
</template>

<script>
import { useAuthorsStore } from '@/store'
import BaseModal from '../../ui/BaseModal.vue'

export default {
    name: 'BookForm',
    components: {
        BaseModal,
    },
    props: {
        initialData: {
            type: Object,
            default: () => ({}),
        },
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
    emits: ['submit', 'close', 'error', 'update:modelValue'],
    data() {
        return {
            form: {
                title: '',
                authorId: '',
                publicationYear: new Date().getFullYear(),
                category: '',
                description: '',
                image: null,
                price: 0,
                inStock: true,
                ...this.initialData,
            },
            fileConfig: {
                maxSize: 10 * 1024 * 1024, // 10MB
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
                file: null,
                preview: null,
                error: null,
            },
            currentImage: null,
            isFileDialogOpen: false,
            isSubmitting: false,
            errorMessage: '',
            titleRules: [
                (v) => !!v || 'Title is required',
                (v) => (v && v.length >= 2) || 'Title must be at least 2 characters',
            ],
            authorRules: [(v) => !!v || 'Author is required'],
            publicationYearRules: [
                (v) => !!v || 'Publication year is required',
                (v) => (v && v > 0) || 'Publication year must be positive',
                (v) => (v && v <= new Date().getFullYear()) || 'Publication year cannot be in the future',
            ],
            descriptionRules: [(v) => !v || v.length <= 2000 || 'Description must be less than 2000 characters'],
            priceRules: [
                (v) => (v !== null && v !== undefined) || 'Price is required',
                (v) => v >= 0 || 'Price must be positive',
            ],
        }
    },
    computed: {
        authorsStore() {
            return useAuthorsStore()
        },

        authorsList() {
            return this.authorsStore.authorsList
        },

        authors() {
            return this.authorsList
        },
        isEdit() {
            return !!this.initialData._id
        },
        submitButtonText() {
            if (this.isSubmitting || this.loading) {
                return this.isEdit ? 'Saving...' : 'Creating...'
            }
            return this.isEdit ? 'Save Changes' : 'Create Book'
        },
        hasImage() {
            return this.fileConfig.file || this.currentImage
        },
        imageFileName() {
            if (this.fileConfig.file) return this.fileConfig.file.name
            if (this.currentImage) return this.currentImage.split('/').pop()
            return ''
        },
        currentPreviewUrl() {
            return this.fileConfig.preview || this.currentImage
        },
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
    },
    watch: {
        initialData: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    const authorId = newVal.author?._id || newVal.authorId || newVal.author
                    this.form = {
                        ...this.form,
                        ...newVal,
                        authorId: authorId,
                    }

                    if (newVal.image) {
                        this.currentImage = newVal.image
                    }

                    this.errorMessage = ''

                    // Reset validation state when data changes
                    if (this.$refs.bookForm) {
                        this.$refs.bookForm.resetValidation()
                    }
                }
            },
            deep: true,
        },
    },
    created() {
        this.fetchAuthors()
    },
    beforeUnmount() {
        this.resetImage()
    },
    methods: {
        fetchAuthors() {
            const authorsStore = useAuthorsStore()
            return authorsStore.fetchAuthors()
        },

        triggerFileInput() {
            this.isFileDialogOpen = true
            this.$refs.fileInput.click()
        },

        validateFile(file) {
            if (!this.fileConfig.allowedTypes.includes(file.type)) {
                throw new Error('Please upload an image file (JPEG, PNG, GIF)')
            }
            if (file.size > this.fileConfig.maxSize) {
                throw new Error('File size should not exceed 10MB')
            }
        },

        handleImageUpload(event) {
            this.isFileDialogOpen = false
            const file = event.target.files[0]
            if (!file) return

            try {
                this.validateFile(file)
                this.fileConfig.file = file
                this.fileConfig.preview = URL.createObjectURL(file)
                this.fileConfig.error = null
            } catch (error) {
                this.fileConfig.error = error.message
                this.resetImage()
            }
        },

        resetImage() {
            if (this.fileConfig.preview) {
                URL.revokeObjectURL(this.fileConfig.preview)
            }
            this.fileConfig = {
                ...this.fileConfig,
                file: null,
                preview: null,
                error: null,
            }
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = ''
            }
        },

        removeCurrentImage() {
            this.currentImage = null
            this.form.image = null
        },

        removeImage() {
            this.resetImage()
            this.removeCurrentImage()
        },

        /**
         * Handle modal close
         */
        handleClose() {
            this.$emit('close')
            this.$emit('update:modelValue', false)

            // Reset form state
            if (this.$refs.bookForm) {
                this.$refs.bookForm.resetValidation()
            }
            this.errorMessage = ''
        },

        /**
         * Handle form submission with validation
         */
        async handleSubmit() {
            this.errorMessage = ''

            try {
                const { valid } = await this.$refs.bookForm.validate()

                if (!valid) {
                    return
                }

                this.isSubmitting = true
                const formData = new FormData()

                const dataToSend = { ...this.form }
                if (this.isEdit) {
                    delete dataToSend._id
                }

                if (this.currentImage && !this.fileConfig.file) {
                    dataToSend.image = this.currentImage
                }

                Object.entries(dataToSend).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formData.append(key, value)
                    }
                })

                if (this.fileConfig.file) {
                    formData.append('image', this.fileConfig.file)
                }

                // Emit submit event with the form data
                this.$emit('submit', {
                    _id: this.isEdit ? this.form._id : undefined,
                    formData,
                })
            } catch (error) {
                this.errorMessage = error.message || 'Failed to save book'
                this.$emit('error', this.errorMessage)
            } finally {
                this.isSubmitting = false
            }
        },
    },
}
</script>
