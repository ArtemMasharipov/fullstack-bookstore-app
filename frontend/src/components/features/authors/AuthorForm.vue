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

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { toast } from '@/store'
import BaseModal from '../../ui/BaseModal.vue'
import ErrorMessage from '../../ui/ErrorMessage.vue'

/**
 * Author form component for creating and editing authors
 */

/**
 * Props definition
 */
const props = defineProps({
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
})

/**
 * Events emitted by this component
 */
const emit = defineEmits(['submit', 'close', 'update:modelValue'])

/**
 * Template refs
 */
const authorForm = ref(null)

/**
 * Reactive data
 */
const form = reactive({ ...props.initialData })
const errorMessage = ref('')

/**
 * Validation rules
 */
const nameRules = [
    (v) => !!v || 'Name is required',
    (v) => (v && v.length >= 2) || 'Name must be at least 2 characters',
]

const biographyRules = [(v) => !v || v.length <= 1000 || 'Biography must be less than 1000 characters']

/**
 * Computed properties
 */
const showModal = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    },
})

const submitButtonText = computed(() => {
    if (props.loading) return 'Saving...'
    return form._id ? 'Update Author' : 'Create Author'
})

/**
 * Watchers
 */
watch(
    () => props.initialData,
    (newData) => {
        Object.assign(form, { ...newData })
        errorMessage.value = ''

        // Reset validation state when data changes
        if (authorForm.value) {
            authorForm.value.resetValidation()
        }
    },
    { deep: true }
)

/**
 * Methods
 */
const handleSubmit = async () => {
    errorMessage.value = ''

    const { valid } = await authorForm.value.validate()

    if (valid) {
        try {
            emit('submit', { ...form })
        } catch (error) {
            errorMessage.value = error.message || 'Failed to save author'
            toast.error(errorMessage.value)
        }
    }
}

const handleClose = () => {
    emit('close')
    emit('update:modelValue', false)

    // Reset form state
    if (authorForm.value) {
        authorForm.value.resetValidation()
    }
}
</script>
