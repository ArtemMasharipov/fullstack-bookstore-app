<template>
    <v-dialog v-model="dialogOpen" max-width="600px" persistent>
        <v-card>
            <v-card-title class="text-h5 bg-primary text-white">
                {{ isEditMode ? 'Edit User' : 'Add New User' }}
            </v-card-title>

            <v-card-text class="pt-4">
                <v-form ref="userForm" validate-on="submit" @submit.prevent="handleSave">
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="userData.username"
                                label="Username"
                                variant="outlined"
                                density="comfortable"
                                :rules="[(v) => !!v || 'Username is required']"
                                :error-messages="formErrors.username"
                                required
                                autofocus
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="userData.email"
                                label="Email"
                                type="email"
                                variant="outlined"
                                density="comfortable"
                                :rules="[(v) => !!v || 'Email is required', (v) => /.+@.+\..+/.test(v) || 'Email must be valid']"
                                :error-messages="formErrors.email"
                                required
                            />
                        </v-col>
                    </v-row>

                    <v-row v-if="!isEditMode">
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="userData.password"
                                label="Password"
                                type="password"
                                variant="outlined"
                                density="comfortable"
                                :rules="[(v) => !!v || 'Password is required', (v) => v.length >= 6 || 'Password must be at least 6 characters']"
                                :error-messages="formErrors.password"
                                required
                            />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="userData.confirmPassword"
                                label="Confirm Password"
                                type="password"
                                variant="outlined"
                                density="comfortable"
                                :rules="[(v) => !!v || 'Please confirm password', (v) => v === userData.password || 'Passwords do not match']"
                                :error-messages="formErrors.confirmPassword"
                                required
                            />
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col cols="12">
                            <v-select
                                v-model="userData.role"
                                :items="roleOptions"
                                label="Role"
                                variant="outlined"
                                density="comfortable"
                                :rules="[(v) => !!v || 'Role is required']"
                                :error-messages="formErrors.role"
                                required
                            />
                        </v-col>
                    </v-row>

                    <v-alert v-if="formErrors.general" type="error" class="mt-4" density="compact">
                        {{ formErrors.general }}
                    </v-alert>
                </v-form>
            </v-card-text>

            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn color="grey" variant="text" @click="handleClose">
                    Cancel
                </v-btn>
                <v-btn
                    color="primary"
                    :loading="formLoading"
                    @click="handleSave"
                >
                    {{ isEditMode ? 'Update' : 'Create' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    user: {
        type: Object,
        default: null
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    formLoading: {
        type: Boolean,
        default: false
    },
    formErrors: {
        type: Object,
        default: () => ({})
    },
    roleOptions: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'save', 'close'])

// Computed
const dialogOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Local state
const userData = ref({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
})

// Watch for user changes
watch(() => props.user, (newUser) => {
    if (newUser) {
        userData.value = {
            id: newUser.id,
            username: newUser.username || '',
            email: newUser.email || '',
            password: '',
            confirmPassword: '',
            role: newUser.role || 'user'
        }
    } else {
        userData.value = {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'user'
        }
    }
}, { immediate: true })

// Methods
const handleSave = () => {
    emit('save', { ...userData.value })
}

const handleClose = () => {
    emit('close')
}
</script>
