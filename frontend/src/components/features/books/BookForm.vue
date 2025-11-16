<template>
    <base-modal v-model="showModal" :title="isEdit ? 'Update Book' : 'Create New Book'" size="large" persistent
        @close="handleClose">
        <v-form ref="bookForm" @submit.prevent="handleSubmit" enctype="multipart/form-data" validate-on="submit lazy">
            <v-row>
                <v-col cols="12">
                    <v-text-field id="title" v-model="form.title" label="Title" variant="outlined" :rules="titleRules"
                        required autofocus></v-text-field>
                </v-col>

                <v-col cols="12">
                    <v-select id="author" v-model="form.authorId" :items="authors" item-title="name" item-value="_id"
                        label="Author" variant="outlined" required :rules="authorRules"
                        :hint="!authors.length ? 'No authors available. Please add an author first.' : ''"
                        persistent-hint></v-select>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field id="year" v-model="form.publicationYear" label="Publication Year" variant="outlined"
                        type="number" :rules="publicationYearRules" required></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field id="category" v-model="form.category" label="Category"
                        variant="outlined"></v-text-field>
                </v-col>

                <v-col cols="12">
                    <v-textarea id="description" v-model="form.description" label="Description" variant="outlined"
                        rows="4" :rules="descriptionRules" auto-grow></v-textarea>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field id="price" v-model.number="form.price" label="Price (грн)" variant="outlined"
                        type="number" step="0.01" min="0" :rules="priceRules" required></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                    <v-switch v-model="form.inStock" label="In Stock" color="success" hide-details density="compact"
                        inset></v-switch>
                </v-col>

                <v-col cols="12">
                    <v-card variant="outlined" class="pa-4">
                        <v-card-title class="pl-0 pt-0">Book Cover</v-card-title>

                        <input ref="fileInput" type="file" accept="image/*" style="display: none"
                            @change="handleImageUpload" />

                        <v-card-text class="pa-0">
                            <v-row v-if="!hasImage" align="center">
                                <v-col cols="12" class="py-2">
                                    <v-btn color="primary" variant="elevated" prepend-icon="mdi-cloud-upload"
                                        @click="triggerFileInput">
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
                                    <v-img :src="currentPreviewUrl" :alt="imageFileName || 'Preview'" class="rounded"
                                        height="200" cover></v-img>
                                </v-col>
                            </v-row>

                            <v-alert v-if="fileConfig.error" type="error" variant="tonal" class="mt-3"
                                density="compact">
                                {{ fileConfig.error }}
                            </v-alert>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4" density="compact" closable
                @click:close="errorMessage = ''">
                {{ errorMessage }}
            </v-alert>
        </v-form>

        <template #actions>
            <v-spacer></v-spacer>

            <v-btn color="secondary" variant="text" :disabled="isSubmitting" @click="handleClose"> Cancel </v-btn>

            <v-btn color="primary" :loading="isSubmitting" :disabled="isSubmitting" @click="handleSubmit"
                :prepend-icon="isEdit ? 'mdi-content-save' : 'mdi-plus'">
                {{ submitButtonText }}
            </v-btn>
        </template>
    </base-modal>
</template>

<script setup>
import { useImageUpload } from '@/composables/useImageUpload'
import { useAuthorsStore } from '@/store'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BaseModal from '../../ui/BaseModal.vue'

/**
 * Props definition
 */
const props = defineProps({
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
})

/**
 * Events emitted by this component
 */
const emit = defineEmits(['submit', 'close', 'error', 'update:modelValue'])

/**
 * Store instances
 */
const authorsStore = useAuthorsStore()

/**
 * Template refs
 */
const bookForm = ref(null)

/**
 * Image upload composable
 */
const {
    fileInput,
    currentImage,
    fileConfig,
    hasImage,
    imageFileName,
    currentPreviewUrl,
    triggerFileInput,
    handleImageUpload,
    setCurrentImage,
    removeImage,
} = useImageUpload()

/**
 * Reactive data
 */
const form = reactive({
    title: '',
    authorId: '',
    publicationYear: new Date().getFullYear(),
    category: '',
    description: '',
    image: null,
    price: 0,
    inStock: true,
})

const isSubmitting = ref(false)
const errorMessage = ref('')

/**
 * Validation rules
 */
const titleRules = [
    (v) => !!v || 'Title is required',
    (v) => (v && v.length >= 2) || 'Title must be at least 2 characters',
]

const authorRules = [(v) => !!v || 'Author is required']

const publicationYearRules = [
    (v) => !!v || 'Publication year is required',
    (v) => (v && v > 0) || 'Publication year must be positive',
    (v) => (v && v <= new Date().getFullYear()) || 'Publication year cannot be in the future',
]

const descriptionRules = [(v) => !v || v.length <= 2000 || 'Description must be less than 2000 characters']

const priceRules = [
    (v) => (v !== null && v !== undefined) || 'Price is required',
    (v) => v >= 0 || 'Price must be positive',
]

/**
 * Computed properties
 */
const authorsList = computed(() => authorsStore.list)
const authors = computed(() => authorsList.value)

const isEdit = computed(() => !!props.initialData._id)

const submitButtonText = computed(() => {
    if (isSubmitting.value || props.loading) {
        return isEdit.value ? 'Saving...' : 'Creating...'
    }
    return isEdit.value ? 'Save Changes' : 'Create Book'
})

const showModal = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    },
})

/**
 * Watchers
 */
watch(
    () => props.initialData,
    (newVal) => {
        if (newVal) {
            const authorId = newVal.author?._id || newVal.authorId || newVal.author
            Object.assign(form, {
                ...newVal,
                authorId: authorId,
            })

            if (newVal.image) {
                setCurrentImage(newVal.image)
            }

            errorMessage.value = ''

            // Reset validation state when data changes
            if (bookForm.value) {
                bookForm.value.resetValidation()
            }
        }
    },
    { immediate: true, deep: true }
)

/**
 * Methods
 */
const fetchAuthors = () => {
    return authorsStore.fetchAuthors()
}

const handleClose = () => {
    emit('close')
    emit('update:modelValue', false)

    // Reset form state
    if (bookForm.value) {
        bookForm.value.resetValidation()
    }
    errorMessage.value = ''
}

const handleSubmit = async () => {
    errorMessage.value = ''

    try {
        const { valid } = await bookForm.value.validate()

        if (!valid) {
            return
        }

        isSubmitting.value = true
        const formData = new FormData()

        const dataToSend = { ...form }
        if (isEdit.value) {
            delete dataToSend._id
        }

        if (currentImage.value && !fileConfig.file) {
            dataToSend.image = currentImage.value
        }

        Object.entries(dataToSend).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value)
            }
        })

        if (fileConfig.file) {
            formData.append('image', fileConfig.file)
        }

        // Emit submit event with the form data
        emit('submit', {
            _id: isEdit.value ? form._id : undefined,
            formData,
        })
    } catch (error) {
        errorMessage.value = error.message || 'Failed to save book'
        emit('error', errorMessage.value)
    } finally {
        isSubmitting.value = false
    }
}

/**
 * Lifecycle hooks
 */
onMounted(() => {
    fetchAuthors()
})
</script>
