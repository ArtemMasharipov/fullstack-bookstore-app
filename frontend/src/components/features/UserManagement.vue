<template>
    <v-container>
        <v-card>
            <v-card-title class="text-h4">User Management</v-card-title>

            <v-card-text>
                <div v-if="loading" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>

                <v-alert v-if="error" type="error" variant="tonal" class="my-3">
                    {{ error }}
                </v-alert>

                <template v-if="isAdmin">
                    <v-btn color="primary" prepend-icon="mdi-refresh" class="mb-4" @click="fetchUsers">
                        Refresh Users
                    </v-btn>

                    <v-table v-if="users.length > 0">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in users" :key="user.id">
                                <td>{{ user.id }}</td>
                                <td>{{ user.username }}</td>
                                <td>{{ user.email }}</td>
                                <td>
                                    <v-btn
                                        color="error"
                                        icon="mdi-delete"
                                        size="small"
                                        variant="text"
                                        @click="confirmDelete(user)"
                                    ></v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>

                    <v-alert v-else type="info" variant="tonal" class="my-3"> No users found. </v-alert>
                </template>

                <v-alert v-else type="warning" variant="tonal" class="my-3">
                    You do not have permission to view this page.
                </v-alert>
            </v-card-text>
        </v-card>
        <v-dialog v-model="showConfirmDialog" max-width="400">
            <v-card>
                <v-card-title>Delete User</v-card-title>
                <v-card-text> Are you sure you want to delete this user? This action cannot be undone. </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="cancelDelete">Cancel</v-btn>
                    <v-btn color="error" @click="performDelete">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import { useAuthStore, useUsersStore, useUsersUiStore } from '@/store'

export default {
    name: 'UserManagement',
    computed: {
        authStore() {
            return useAuthStore()
        },
        usersStore() {
            return useUsersStore()
        },
        usersUiStore() {
            return useUsersUiStore()
        },
        users() {
            return this.usersStore.usersList
        },
        loading() {
            return this.usersStore.usersLoading
        },
        error() {
            return this.usersStore.usersError
        },
        isAuthenticated() {
            return this.authStore.isAuthenticated
        },
        isAdmin() {
            return this.authStore.isAdmin
        },
        showConfirmDialog() {
            return this.usersUiStore.getShowConfirmDialog
        },
        userToDelete() {
            return this.usersUiStore.getUserToDelete
        },
    },

    created() {
        if (this.isAdmin) {
            this.fetchUsers()
        }
    },

    methods: {
        fetchUsers() {
            return this.usersUiStore.fetchUsers()
        },
        confirmDelete(user) {
            return this.usersUiStore.confirmDelete(user)
        },
        cancelDelete() {
            return this.usersUiStore.cancelDelete()
        },
        performDelete() {
            return this.usersUiStore.performDelete()
        },
    },
}
</script>
