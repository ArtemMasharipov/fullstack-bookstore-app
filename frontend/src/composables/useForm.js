/**
 * Composable for handling form state and validation
 * Provides reactive form state, validation, and submission handling
 */
import { computed, reactive, ref, watch } from 'vue'

export function useForm(initialData = {}, validationRules = {}, options = {}) {
    const {
        resetAfterSubmit = false,
        showSuccessMessage = true,
        showErrorMessage = true,
        validateOnChange = true,
        validateOnBlur = true,
    } = options

    // Form state
    const formData = reactive({ ...initialData })
    const errors = reactive({})
    const touched = reactive({})
    const isSubmitting = ref(false)
    const isValidating = ref(false)
    const submitCount = ref(0)

    // Computed properties
    const hasErrors = computed(() => Object.keys(errors).length > 0)
    const isValid = computed(() => !hasErrors.value)
    const isDirty = computed(() => {
        return Object.keys(touched).some((key) => touched[key])
    })

    const canSubmit = computed(() => {
        return isValid.value && !isSubmitting.value && isDirty.value
    })

    // Validation methods
    function validateField(fieldName) {
        const rules = validationRules[fieldName]
        if (!rules) return true

        const value = formData[fieldName]

        for (const rule of rules) {
            if (typeof rule === 'function') {
                const result = rule(value, formData)
                if (result !== true) {
                    errors[fieldName] = result
                    return false
                }
            } else if (typeof rule === 'object') {
                const { validator, message } = rule
                if (!validator(value, formData)) {
                    errors[fieldName] = message
                    return false
                }
            }
        }

        // If we get here, field is valid
        delete errors[fieldName]
        return true
    }

    async function validateForm() {
        isValidating.value = true

        try {
            const fieldNames = Object.keys(validationRules)
            const validationPromises = fieldNames.map((fieldName) => Promise.resolve(validateField(fieldName)))

            await Promise.all(validationPromises)
            return isValid.value
        } finally {
            isValidating.value = false
        }
    }

    // Field interaction handlers
    function handleFieldChange(fieldName, value) {
        formData[fieldName] = value
        touched[fieldName] = true

        if (validateOnChange) {
            validateField(fieldName)
        }
    }

    function handleFieldBlur(fieldName) {
        touched[fieldName] = true

        if (validateOnBlur) {
            validateField(fieldName)
        }
    }

    // Form submission
    async function handleSubmit(submitFn, options = {}) {
        const { validate = true, successMessage = 'Form submitted successfully', errorMessage = null } = options

        if (isSubmitting.value) return

        submitCount.value++
        isSubmitting.value = true

        try {
            // Mark all fields as touched
            Object.keys(formData).forEach((key) => {
                touched[key] = true
            })

            // Validate if required
            if (validate) {
                const isValidForm = await validateForm()
                if (!isValidForm) {
                    if (showErrorMessage) {
                        console.error('Please fix the errors before submitting')
                    }
                    return false
                }
            }

            // Call the submit function
            const result = await submitFn(formData)

            // Show success message
            if (showSuccessMessage && successMessage) {
                console.log(successMessage)
            }

            // Reset form if configured
            if (resetAfterSubmit) {
                resetForm()
            }

            return result
        } catch (error) {
            // Show error message
            if (showErrorMessage) {
                const message = errorMessage || error.message || 'Form submission failed'
                console.error(message)
            }

            throw error
        } finally {
            isSubmitting.value = false
        }
    }

    // Form reset and utilities
    function resetForm() {
        Object.keys(formData).forEach((key) => {
            formData[key] = initialData[key] || ''
        })

        Object.keys(errors).forEach((key) => {
            delete errors[key]
        })

        Object.keys(touched).forEach((key) => {
            touched[key] = false
        })

        submitCount.value = 0
    }

    function clearErrors() {
        Object.keys(errors).forEach((key) => {
            delete errors[key]
        })
    }

    function setFieldValue(fieldName, value) {
        formData[fieldName] = value
        if (validateOnChange) {
            validateField(fieldName)
        }
    }

    function setFieldError(fieldName, errorMessage) {
        errors[fieldName] = errorMessage
    }

    function setFormData(newData) {
        Object.assign(formData, newData)
    }

    // Get field helpers
    function getFieldProps(fieldName) {
        return {
            value: formData[fieldName],
            error: errors[fieldName],
            touched: touched[fieldName],
            onChange: (value) => handleFieldChange(fieldName, value),
            onBlur: () => handleFieldBlur(fieldName),
            invalid: !!errors[fieldName],
        }
    }

    // Watch for validation on change
    if (validateOnChange) {
        Object.keys(validationRules).forEach((fieldName) => {
            watch(
                () => formData[fieldName],
                () => {
                    if (touched[fieldName]) {
                        validateField(fieldName)
                    }
                },
                { deep: true }
            )
        })
    }

    return {
        // State
        formData,
        errors,
        touched,
        isSubmitting,
        isValidating,
        submitCount,

        // Computed
        hasErrors,
        isValid,
        isDirty,
        canSubmit,

        // Methods
        validateField,
        validateForm,
        handleFieldChange,
        handleFieldBlur,
        handleSubmit,
        resetForm,
        clearErrors,
        setFieldValue,
        setFieldError,
        setFormData,
        getFieldProps,
    }
}

// Common validation rules
export const validationRules = {
    required: (message = 'This field is required') => ({
        validator: (value) => value !== null && value !== undefined && value !== '',
        message,
    }),

    email: (message = 'Please enter a valid email address') => ({
        validator: (value) => {
            if (!value) return true // Allow empty if not required
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return emailRegex.test(value)
        },
        message,
    }),

    minLength: (min, message = null) => ({
        validator: (value) => {
            if (!value) return true // Allow empty if not required
            return value.length >= min
        },
        message: message || `Must be at least ${min} characters`,
    }),

    maxLength: (max, message = null) => ({
        validator: (value) => {
            if (!value) return true // Allow empty if not required
            return value.length <= max
        },
        message: message || `Must be no more than ${max} characters`,
    }),

    min: (min, message = null) => ({
        validator: (value) => {
            if (!value) return true // Allow empty if not required
            return Number(value) >= min
        },
        message: message || `Must be at least ${min}`,
    }),

    max: (max, message = null) => ({
        validator: (value) => {
            if (!value) return true // Allow empty if not required
            return Number(value) <= max
        },
        message: message || `Must be no more than ${max}`,
    }),

    password: (message = 'Password must be at least 8 characters with uppercase, lowercase, and number') => ({
        validator: (value) => {
            if (!value) return true // Allow empty if not required
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
            return passwordRegex.test(value)
        },
        message,
    }),

    confirmPassword: (passwordField = 'password', message = 'Passwords do not match') => ({
        validator: (value, formData) => {
            return value === formData[passwordField]
        },
        message,
    }),

    url: (message = 'Please enter a valid URL') => ({
        validator: (value) => {
            if (!value) return true // Allow empty if not required
            try {
                new URL(value)
                return true
            } catch {
                return false
            }
        },
        message,
    }),
}
