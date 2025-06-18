<template>
    <v-dialog v-model="localVisible" max-width="800" persistent scrollable>
        <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
                <span>{{ isEdit ? 'Edit Book' : 'Add New Book' }}</span>
                <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text class="pa-6">
                <v-form ref="form" @submit.prevent="submitForm">
                    <v-row>
                        <!-- Title -->
                        <v-col cols="12" md="8">
                            <v-text-field
                                v-model="formData.title"
                                label="Book Title *"
                                :rules="[rules.required]"
                                variant="outlined"
                                density="comfortable"
                            ></v-text-field>
                        </v-col>

                        <!-- ISBN -->
                        <v-col cols="12" md="4">
                            <v-text-field
                                v-model="formData.isbn"
                                label="ISBN *"
                                :rules="[rules.required]"
                                variant="outlined"
                                density="comfortable"
                            ></v-text-field>
                        </v-col>

                        <!-- Author -->
                        <v-col cols="12" md="6">
                            <v-select
                                v-model="formData.authorId"
                                :items="authorOptions"
                                label="Author *"
                                :rules="[rules.required]"
                                variant="outlined"
                                density="comfortable"
                            ></v-select>
                        </v-col>

                        <!-- Category -->
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.category"
                                label="Category *"
                                :rules="[rules.required]"
                                variant="outlined"
                                density="comfortable"
                            ></v-text-field>
                        </v-col>

                        <!-- Price -->
                        <v-col cols="12" md="4">
                            <v-text-field
                                v-model.number="formData.price"
                                label="Price *"
                                type="number"
                                step="0.01"
                                min="0"
                                :rules="[rules.required, rules.price]"
                                variant="outlined"
                                density="comfortable"
                                prefix="$"
                            ></v-text-field>
                        </v-col>

                        <!-- Stock -->
                        <v-col cols="12" md="4">
                            <v-text-field
                                v-model.number="formData.stock"
                                label="Stock Quantity *"
                                type="number"
                                min="0"
                                :rules="[rules.required, rules.stock]"
                                variant="outlined"
                                density="comfortable"
                            ></v-text-field>
                        </v-col>

                        <!-- Status -->
                        <v-col cols="12" md="4">
                            <v-select
                                v-model="formData.status"
                                :items="statusOptions"
                                label="Status *"
                                :rules="[rules.required]"
                                variant="outlined"
                                density="comfortable"
                            ></v-select>
                        </v-col>

                        <!-- Description -->
                        <v-col cols="12">
                            <v-textarea
                                v-model="formData.description"
                                label="Description"
                                variant="outlined"
                                density="comfortable"
                                rows="3"
                                auto-grow
                            ></v-textarea>
                        </v-col>

                        <!-- Cover Image URL -->
                        <v-col cols="12">
                            <v-text-field
                                v-model="formData.coverImage"
                                label="Cover Image URL"
                                variant="outlined"
                                density="comfortable"
                                hint="Enter a URL for the book cover image"
                                persistent-hint
                            ></v-text-field>
                        </v-col>

                        <!-- Cover Image Preview -->
                        <v-col cols="12" v-if="formData.coverImage">
                            <div class="text-subtitle-2 mb-2">Cover Preview:</div>
                            <v-img
                                :src="formData.coverImage"
                                max-width="200"
                                max-height="300"
                                class="rounded border"
                                @error="imageError = true"
                            >
                                <template #error>
                                    <div class="d-flex align-center justify-center h-100">
                                        <v-icon size="48" color="grey">mdi-image-broken</v-icon>
                                    </div>
                                </template>
                            </v-img>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-6">
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="closeDialog" :disabled="loading"> Cancel </v-btn>
                <v-btn color="primary" variant="flat" @click="submitForm" :loading="loading">
                    {{ isEdit ? 'Update' : 'Create' }} Book
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    book: {
        type: Object,
        default: null,
    },
    authors: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
})

// Emits
const emit = defineEmits(['update:visible', 'submit'])

// Reactive data
const imageError = ref(false)
const formData = ref({
    title: '',
    isbn: '',
    authorId: null,
    category: '',
    price: 0,
    stock: 0,
    status: 'published',
    description: '',
    coverImage: '',
})

const rules = {
    required: (value) => !!value || 'This field is required',
    price: (value) => value >= 0 || 'Price must be greater than or equal to 0',
    stock: (value) => (value >= 0 && Number.isInteger(Number(value))) || 'Stock must be a non-negative integer',
}

const statusOptions = ref([
    { title: 'Published', value: 'published' },
    { title: 'Draft', value: 'draft' },
    { title: 'Discontinued', value: 'discontinued' },
])

// Form reference
const form = ref(null)

// Computed properties
const localVisible = computed({
    get() {
        return props.visible
    },
    set(value) {
        emit('update:visible', value)
    },
})

const isEdit = computed(() => {
    return !!props.book
})

const authorOptions = computed(() => {
    return props.authors.map((author) => ({
        title: author.name,
        value: author.id,
    }))
})

// Watchers
watch(
    () => props.visible,
    (newVal) => {
        if (newVal) {
            resetForm()
            if (props.book) {
                populateForm()
            }
        }
    }
)

// Methods
const resetForm = () => {
    formData.value = {
        title: '',
        isbn: '',
        authorId: null,
        category: '',
        price: 0,
        stock: 0,
        status: 'published',
        description: '',
        coverImage: '',
    }
    imageError.value = false

    if (form.value) {
        form.value.resetValidation()
    }
}

const populateForm = () => {
    if (props.book) {
        formData.value = {
            title: props.book.title || '',
            isbn: props.book.isbn || '',
            authorId: props.book.authorId || props.book.author?.id || null,
            category: props.book.category || '',
            price: props.book.price || 0,
            stock: props.book.stock || 0,
            status: props.book.status || 'published',
            description: props.book.description || '',
            coverImage: props.book.coverImage || '',
        }
    }
}

const submitForm = async () => {
    if (!form.value) return

    const { valid } = await form.value.validate()
    if (!valid) return

    const submitData = { ...formData.value }
    if (isEdit.value) {
        submitData.id = props.book.id
    }

    emit('submit', submitData)
}

const closeDialog = () => {
    localVisible.value = false
}
</script>
