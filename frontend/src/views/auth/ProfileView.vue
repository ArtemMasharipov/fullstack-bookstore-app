<template>
    <v-container class="py-8">
        <div class="text-center mb-8">
            <h1 class="text-h4 font-weight-bold">My Profile</h1>
            <p class="text-body-1 text-medium-emphasis mt-1">Manage your personal details and settings</p>
        </div>

        <v-row justify="center">
            <!-- Profile Card -->
            <v-col cols="12" md="7" lg="8">
                <v-card class="pa-6">
                    <!-- Avatar -->
                    <div class="text-center mb-6">
                        <v-avatar size="96" color="primary" class="mb-3">
                            <span class="text-h4 font-weight-bold text-white">{{ userInitials }}</span>
                        </v-avatar>
                        <div>
                            <v-btn variant="text" size="small" prepend-icon="mdi-camera-outline"> Change photo </v-btn>
                        </div>
                    </div>

                    <!-- Profile Form -->
                    <v-form @submit.prevent="updateProfile">
                        <v-row>
                            <v-col cols="12" sm="6">
                                <v-text-field
                                    id="firstName"
                                    v-model="profile.firstName"
                                    label="First Name"
                                    :disabled="!isEditing"
                                />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field
                                    id="lastName"
                                    v-model="profile.lastName"
                                    label="Last Name"
                                    :disabled="!isEditing"
                                />
                            </v-col>
                        </v-row>

                        <v-text-field
                            id="email"
                            v-model="profile.email"
                            label="Email"
                            type="email"
                            disabled
                            hint="Email cannot be changed"
                            persistent-hint
                        />

                        <v-text-field
                            id="phone"
                            v-model="profile.phone"
                            label="Phone"
                            type="tel"
                            :disabled="!isEditing"
                        />

                        <div class="d-flex ga-3 mt-2">
                            <v-btn
                                v-if="!isEditing"
                                color="primary"
                                prepend-icon="mdi-pencil-outline"
                                @click="startEditing"
                            >
                                Edit
                            </v-btn>

                            <template v-else>
                                <v-btn type="submit" color="success" :loading="loading" prepend-icon="mdi-check">
                                    Save
                                </v-btn>
                                <v-btn variant="outlined" color="default" @click="cancelEditing"> Cancel </v-btn>
                            </template>
                        </div>
                    </v-form>
                </v-card>
            </v-col>

            <!-- Actions Card -->
            <v-col cols="12" md="5" lg="4">
                <v-card>
                    <v-card-title class="text-h6">Quick Actions</v-card-title>
                    <v-card-text class="pa-0">
                        <v-list>
                            <v-list-item>
                                <template v-slot:default>
                                    <v-list-item-title>Change Password</v-list-item-title>
                                    <v-list-item-subtitle
                                        >Update your password for better security</v-list-item-subtitle
                                    >
                                </template>
                                <template v-slot:append>
                                    <v-btn variant="outlined" size="small">Change</v-btn>
                                </template>
                            </v-list-item>

                            <v-divider />

                            <v-list-item>
                                <template v-slot:default>
                                    <v-list-item-title>My Orders</v-list-item-title>
                                    <v-list-item-subtitle>View purchase history</v-list-item-subtitle>
                                </template>
                                <template v-slot:append>
                                    <v-btn variant="outlined" size="small" :to="{ name: 'Orders' }">View</v-btn>
                                </template>
                            </v-list-item>

                            <v-divider />

                            <v-list-item>
                                <template v-slot:default>
                                    <v-list-item-title class="text-error">Delete Account</v-list-item-title>
                                    <v-list-item-subtitle>Permanently delete your account</v-list-item-subtitle>
                                </template>
                                <template v-slot:append>
                                    <v-btn
                                        variant="outlined"
                                        size="small"
                                        color="error"
                                        @click="showDeleteDialog = true"
                                    >
                                        Delete
                                    </v-btn>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Delete Account Confirmation -->
        <confirm-modal
            v-model="showDeleteDialog"
            title="Delete Account"
            message="Are you sure you want to delete your account? This action cannot be undone."
            confirm-text="Delete"
            @confirm="deleteAccount"
        />
    </v-container>
</template>

<script setup>
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useAuthStore } from '@/stores'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const isEditing = ref(false)
const loading = ref(false)
const showDeleteDialog = ref(false)
const profile = ref({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
})
const originalProfile = ref({})

const user = computed(() => authStore.user)
const userInitials = computed(() => {
    const first = profile.value.firstName?.charAt(0) || ''
    const last = profile.value.lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || 'U'
})

const loadProfile = () => {
    if (user.value) {
        profile.value = { ...user.value }
        originalProfile.value = { ...user.value }
    }
}

const startEditing = () => {
    isEditing.value = true
    originalProfile.value = { ...profile.value }
}

const cancelEditing = () => {
    isEditing.value = false
    profile.value = { ...originalProfile.value }
}

const updateProfile = async () => {
    loading.value = true
    try {
        await authStore.updateProfile(profile.value)
        isEditing.value = false
    } catch (error) {
        // Error updating profile
    } finally {
        loading.value = false
    }
}

const deleteAccount = async () => {
    try {
        await authStore.deleteAccount()
        router.push({ name: 'Home' })
    } catch (error) {
        // Error deleting account
    }
}

onMounted(() => {
    loadProfile()
})
</script>
