<template>
    <div class="admin-users">
        <!-- Users management data table -->
        <admin-data-table
            :headers="headers"
            :items="users"
            :loading="loading"
            :total-items="totalItems"
            :page="page"
            :items-per-page="itemsPerPage"
            :sort-by="sortBy"
            :search="search"
            title="Users Management"
            @update:page="updatePage"
            @update:items-per-page="updateItemsPerPage"
            @update:sort-by="updateSortBy"
            @update:search="updateSearch"
            @reset-filters="resetFilters"
        >
            <!-- Table actions -->
            <template #actions>
                <v-btn color="primary" prepend-icon="mdi-plus" @click="openUserDialog()"> Add New User </v-btn>
            </template>

            <!-- Role column -->
            <template #[`item.role`]="{ item }">
                <v-chip size="small" :color="getRoleColor(getRoleName(item))" variant="tonal">
                    {{ getRoleName(item) }}
                </v-chip>
            </template>

            <!-- Actions column -->
            <template #[`item.actions`]="{ item }">
                <div class="d-flex justify-center">
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        color="primary"
                        class="mr-1"
                        @click="openUserDialog(item.raw)"
                    >
                        <v-icon>mdi-pencil</v-icon>
                        <v-tooltip activator="parent" location="top">Edit</v-tooltip>
                    </v-btn>
                    <v-btn icon variant="text" size="small" color="error" @click="confirmDeleteUser(item.raw)">
                        <v-icon>mdi-delete</v-icon>
                        <v-tooltip activator="parent" location="top">Delete</v-tooltip>
                    </v-btn>
                </div>
            </template>
        </admin-data-table>

        <!-- User edit/create dialog -->
        <user-dialog
            v-model="userDialogOpen"
            :user="selectedUser"
            :is-edit-mode="isEditMode"
            :form-loading="formLoading"
            :form-errors="formErrors"
            :role-options="roleOptions"
            @save="saveUser"
            @close="closeUserDialog"
        />

        <!-- Delete confirmation dialog -->
        <v-dialog v-model="deleteDialogOpen" max-width="500px">
            <v-card>
                <v-card-title class="text-h5 bg-error text-white"> Confirm Delete </v-card-title>

                <v-card-text class="pt-4">
                    <p>
                        Are you sure you want to delete user
                        <strong>{{ selectedUser?.username || selectedUser?.email }}</strong
                        >? This action cannot be undone.
                    </p>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
                    <v-btn color="error" :loading="formLoading" @click="deleteUser"> Delete </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { computed } from 'vue'

// Components
import AdminDataTable from '@/components/features/admin/AdminDataTable.vue'
import UserDialog from '@/components/features/admin/UserDialog.vue'

// Composables
import { useUserManagement } from '@/composables/useUserManagement'

// Use the user management composable
const {
    users,
    loading,
    roles,
    userDialogOpen,
    deleteDialogOpen,
    isEditMode,
    selectedUser,
    formLoading,
    formErrors,
    page,
    itemsPerPage,
    sortBy,
    search,
    totalItems,
    openUserDialog,
    closeUserDialog,
    confirmDeleteUser,
    closeDeleteDialog,
    saveUser,
    deleteUser,
    updatePage,
    updateItemsPerPage,
    updateSortBy,
    updateSearch,
    resetFilters,
    getRoleName,
    getRoleColor,
} = useUserManagement()

// Table headers
const headers = computed(() => [
    { title: 'Username', align: 'start', key: 'username' },
    { title: 'Email', align: 'start', key: 'email' },
    { title: 'Role', align: 'center', key: 'role' },
    { title: 'Registered', align: 'start', key: 'createdAt' },
    { title: 'Actions', align: 'center', key: 'actions', sortable: false },
])

// Role options for the dialog
const roleOptions = computed(() => {
    return roles.value.map((role) => ({
        id: role._id,
        name: role.name,
        value: role._id,
    }))
})
</script>
