/**
 * Composable for handling image upload functionality
 * Provides file validation, preview, and management capabilities
 */

import { computed, onBeforeUnmount, reactive, ref } from 'vue'

/**
 * Configuration options for image upload
 * @typedef {Object} ImageUploadOptions
 * @property {number} maxSize - Maximum file size in bytes (default: 10MB)
 * @property {string[]} allowedTypes - Allowed MIME types (default: JPEG, PNG, GIF)
 */

/**
 * @param {ImageUploadOptions} options
 * @returns {Object} Image upload state and methods
 */
export function useImageUpload(options = {}) {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    } = options

    // Reactive state
    const fileInput = ref(null)
    const currentImage = ref(null)

    const fileConfig = reactive({
        maxSize,
        allowedTypes,
        file: null,
        preview: null,
        error: null,
    })

    // Computed properties
    const hasImage = computed(() => fileConfig.file || currentImage.value)

    const imageFileName = computed(() => {
        if (fileConfig.file) return fileConfig.file.name
        if (currentImage.value) return currentImage.value.split('/').pop()
        return ''
    })

    const currentPreviewUrl = computed(() => fileConfig.preview || currentImage.value)

    // Methods
    const validateFile = (file) => {
        if (!fileConfig.allowedTypes.includes(file.type)) {
            throw new Error('Please upload an image file (JPEG, PNG, GIF)')
        }
        if (file.size > fileConfig.maxSize) {
            const maxSizeMB = (fileConfig.maxSize / (1024 * 1024)).toFixed(0)
            throw new Error(`File size should not exceed ${maxSizeMB}MB`)
        }
    }

    const triggerFileInput = () => {
        fileInput.value?.click()
    }

    const handleImageUpload = (event) => {
        const file = event.target.files[0]
        if (!file) return

        try {
            validateFile(file)
            fileConfig.file = file
            fileConfig.preview = URL.createObjectURL(file)
            fileConfig.error = null
        } catch (error) {
            fileConfig.error = error.message
            resetImage()
        }
    }

    const resetImage = () => {
        if (fileConfig.preview) {
            URL.revokeObjectURL(fileConfig.preview)
        }
        Object.assign(fileConfig, {
            ...fileConfig,
            file: null,
            preview: null,
            error: null,
        })
        if (fileInput.value) {
            fileInput.value.value = ''
        }
    }

    const setCurrentImage = (imageUrl) => {
        currentImage.value = imageUrl
    }

    const removeCurrentImage = () => {
        currentImage.value = null
    }

    const removeImage = () => {
        resetImage()
        removeCurrentImage()
    }

    // Cleanup on unmount
    onBeforeUnmount(() => {
        resetImage()
    })

    return {
        // Refs
        fileInput,
        currentImage,
        fileConfig,

        // Computed
        hasImage,
        imageFileName,
        currentPreviewUrl,

        // Methods
        triggerFileInput,
        handleImageUpload,
        setCurrentImage,
        removeCurrentImage,
        removeImage,
        resetImage,
    }
}
