<template>
    <div class="admin-settings">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-cog" class="me-3" color="primary"></v-icon>
                <span>Admin Settings</span>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text>
                <p class="text-subtitle-1 mb-4">System Settings</p>

                <v-list>
                    <v-list-item>
                        <template v-slot:prepend>
                            <v-icon color="primary">mdi-theme-light-dark</v-icon>
                        </template>
                        <v-list-item-title>Theme</v-list-item-title>
                        <template v-slot:append>
                            <v-switch v-model="darkMode" color="primary" hide-details density="compact"></v-switch>
                        </template>
                    </v-list-item>

                    <v-list-item>
                        <template v-slot:prepend>
                            <v-icon color="primary">mdi-database</v-icon>
                        </template>
                        <v-list-item-title>Cache Management</v-list-item-title>
                        <template v-slot:append>
                            <v-btn color="primary" variant="text" @click="clearCache">Clear Cache</v-btn>
                        </template>
                    </v-list-item>

                    <v-list-item>
                        <template v-slot:prepend>
                            <v-icon color="primary">mdi-bell</v-icon>
                        </template>
                        <v-list-item-title>Notifications</v-list-item-title>
                        <template v-slot:append>
                            <v-switch v-model="notificationsEnabled" color="primary" hide-details
                                density="compact"></v-switch>
                        </template>
                    </v-list-item>
                </v-list>

                <p class="text-subtitle-1 mt-6 mb-4">Account Settings</p>

                <v-list>
                    <v-list-item>
                        <template v-slot:prepend>
                            <v-icon color="primary">mdi-account</v-icon>
                        </template>
                        <v-list-item-title>Profile Settings</v-list-item-title>
                        <template v-slot:append>
                            <v-btn color="primary" variant="text">Manage</v-btn>
                        </template>
                    </v-list-item>

                    <v-list-item>
                        <template v-slot:prepend>
                            <v-icon color="primary">mdi-lock</v-icon>
                        </template>
                        <v-list-item-title>Security Settings</v-list-item-title>
                        <template v-slot:append>
                            <v-btn color="primary" variant="text">Configure</v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup>
import { logger } from '@/utils/logger'
import { ref } from 'vue'

// Reactive state
const darkMode = ref(false)
const notificationsEnabled = ref(true)

// Methods
const clearCache = () => {
    // This would be connected to a real cache clearing function
    setTimeout(() => {
        logger.info('Cache cleared successfully!', 'admin-settings')
    }, 800)
}
</script>
