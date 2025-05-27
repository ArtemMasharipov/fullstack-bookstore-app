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
            <template #item.role="{ item }">
                <v-chip size="small" :color="getRoleColor(getRoleName(item))" variant="tonal">
                    {{ getRoleName(item) }}
                </v-chip>
            </template>

            <!-- Actions column -->
            <template #item.actions="{ item }">
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
        <v-dialog v-model="userDialogOpen" max-width="600px">
            <v-card>
                <v-card-title class="text-h5 bg-primary text-white">
                    {{ isEditMode ? 'Edit User' : 'Add New User' }}
                </v-card-title>

                <v-card-text class="pt-4">
                    <v-form ref="userForm" validate-on="submit" @submit.prevent="saveUser">
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="editedUser.username"
                                    label="Username"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[(v) => !!v || 'Username is required']"
                                    required
                                    autofocus
                                ></v-text-field>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="editedUser.email"
                                    label="Email"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[
                                        (v) => !!v || 'Email is required',
                                        (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
                                    ]"
                                ></v-text-field>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="editedUser.password"
                                    label="Password"
                                    variant="outlined"
                                    density="comfortable"
                                    type="password"
                                    :rules="[
                                        (v) => !isEditMode || !!v || 'Password is required for new users',
                                        (v) => !v || v.length >= 8 || 'Password must be at least 8 characters',
                                    ]"
                                    :placeholder="
                                        isEditMode ? 'Leave empty to keep current password' : 'Enter password'
                                    "
                                ></v-text-field>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-select
                                    v-model="editedUser.role"
                                    :items="availableRoles"
                                    item-title="name"
                                    item-value="id"
                                    label="Role"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[(v) => !!v || 'Role is required']"
                                ></v-select>
                            </v-col>
                        </v-row>

                        <!-- Add error alert -->
                        <v-alert
                            v-if="formError"
                            type="error"
                            variant="tonal"
                            class="mt-4"
                            closable
                            @click:close="formError = null"
                        >
                            {{ formError }}
                        </v-alert>
                    </v-form>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="userDialogOpen = false">Cancel</v-btn>
                    <v-btn color="primary" :loading="saving" type="submit" @click.prevent="saveUser"> Save </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete confirmation dialog -->
        <v-dialog v-model="deleteDialogOpen" max-width="500px">
            <v-card>
                <v-card-title class="text-h5 bg-error text-white"> Confirm Delete </v-card-title>

                <v-card-text class="pt-4">
                    <p>
                        Are you sure you want to delete user
                        <strong>{{ userToDelete?.username || userToDelete?.email }}</strong
                        >? This action cannot be undone.
                    </p>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="deleteDialogOpen = false">Cancel</v-btn>
                    <v-btn color="error" :loading="deleting" @click="deleteUser"> Delete </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Components
import AdminDataTable from '@/components/features/admin/AdminDataTable.vue'

// Stores
import { useUsersStore } from '@/store/modules/users'
import { toast } from '@/store/modules/ui'

// Table state
const headers = ref([
    { title: 'Username', align: 'start', key: 'username' },
    { title: 'Email', align: 'start', key: 'email' },
    { title: 'Role', align: 'center', key: 'role' },
    { title: 'Registered', align: 'start', key: 'createdAt' },
    { title: 'Actions', align: 'center', key: 'actions', sortable: false },
])

const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref([{ key: 'username', order: 'asc' }])
const search = ref('')
const totalItems = ref(0)

// Form state
const userDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const isEditMode = ref(false)
const editedUser = ref(null)
const saving = ref(false)
const deleting = ref(false)
const userToDelete = ref(null)

// Default user data
const roles = ref([])

// Dynamic role mapping from API
const dynamicRoleMap = ref({})

// Form error state
const formError = ref(null)

// Form reference
const userForm = ref(null)

// Store instances
const usersStore = useUsersStore()

// Computed properties
const users = computed(() => {
    return usersStore.usersList || []
})

const loading = computed(() => {
    return usersStore.loading
})

/**
 * Format roles for display in the dropdown
 */
const availableRoles = computed(() => {
    // Use roles loaded from API
    return roles.value.map((role) => ({
        id: role._id,
        name: capitalizeFirst(role.name),
    }))
})

/**
 * Map of role IDs to their names for easy reference
 * Based on roles loaded from API
 */
const roleNameMap = computed(() => {
    // Use only the dynamic roles loaded from API
    return dynamicRoleMap.value || {}
})

/**
 * Initialize the component data
 */
const initializeComponent = async () => {
    try {
        // First load roles to ensure we have them for display
        await loadRoles()

        // Then load user data
        await loadUsers()

        // Component initialization completed
    } catch (error) {
        toast.error('Failed to initialize component')
    }
}

// Data loading
const loadUsers = async () => {
    try {
        await usersStore.fetchUsers()
        totalItems.value = usersStore.usersList?.length || 0
    } catch (error) {
        toast.error('Failed to load users')
    }
}

const loadRoles = async () => {
    try {
        // Load roles from API
        const response = await fetch('/api/v1/roles')

        if (!response.ok) {
            // Initialize with empty roles if API fails
            roles.value = []
            return
        }

        const rolesData = await response.json()

        // Update our data if roles were successfully loaded
        if (rolesData && Array.isArray(rolesData.data)) {
            // 1. Store full role objects for the dropdown
            roles.value = rolesData.data

            // 2. Create a map for role ID -> name resolution
            const roleMap = {}
            rolesData.data.forEach((role) => {
                if (role._id && role.name) {
                    roleMap[role._id] = role.name.toLowerCase()
                }
            })

            // Store the role information for future use
            dynamicRoleMap.value = roleMap
        } else {
            // API returned unexpected format for roles
        }
    } catch (error) {
        // Initialize with empty roles if API fails
        roles.value = []
    }
}

// Table methods
const updatePage = (newPage) => {
    page.value = newPage
}

const updateItemsPerPage = (newItemsPerPage) => {
    itemsPerPage.value = newItemsPerPage
}

const updateSortBy = (newSortBy) => {
    sortBy.value = newSortBy
}

const updateSearch = (newSearch) => {
    search.value = newSearch
}

const resetFilters = () => {
    page.value = 1
    search.value = ''
    sortBy.value = [{ key: 'username', order: 'asc' }]
}

const getRoleColor = (role) => {
    // Convert role name to lowercase for case-insensitive matching
    const roleLower = role ? role.toLowerCase() : ''

    switch (roleLower) {
        case 'admin':
            return 'error'
        case 'moderator':
            return 'warning'
        case 'user':
            return 'primary'
        default:
            return 'grey'
    }
}

/**
 * Get role name from user item, handling different data structures
 * @param {Object} item - User item from table
 * @returns {String} Role name with proper capitalization
 */
const getRoleName = (item) => {
    // The raw property may contain the data we need
    const userData = item.raw || item

    // Case 1: Role is an object with a name property
    if (userData?.role && typeof userData.role === 'object' && userData.role.name) {
        const name = userData.role.name
        return capitalizeFirst(name)
    }

    // Case 2: Role is a string (role ID or direct role name)
    if (userData?.role && typeof userData.role === 'string') {
        // Look up in role map first
        const mappedName = mapRoleIdToName(userData.role)

        if (mappedName && mappedName !== 'Unknown') {
            return capitalizeFirst(mappedName)
        }

        // If not found in map, return just the role string with capitalization
        // This handles the case where role is already a name string, not an ID
        return capitalizeFirst(userData.role)
    }

    return 'Unknown'
}

/**
 * Capitalize the first letter of a string
 * @param {String} str - Input string
 * @returns {String} Capitalized string
 */
const capitalizeFirst = (str) => {
    if (!str || typeof str !== 'string') return 'Unknown'
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Map role ID to a human-readable name
 * @param {String} roleId - Role ID or role name
 * @returns {String} Human-readable role name or null if not found
 */
const mapRoleIdToName = (roleId) => {
    // Simple lookup in our role mapping
    return roleNameMap.value[roleId] || null
}

// User dialog methods
const openUserDialog = (user = null) => {
    // Check if roles are loaded before opening dialog
    if (roles.value.length === 0) {
        // Reload roles if they're not available
        loadRoles().then(() => {
            if (roles.value.length === 0) {
                // Still no roles after reload attempt
                toast.error('Cannot open user dialog: Roles data is not available. Please try again later.')
                return
            }
            // If roles are loaded successfully, continue opening dialog
            processUserDialogOpen(user)
        })
    } else {
        // Roles are already loaded, continue opening dialog
        processUserDialogOpen(user)
    }
}

/**
 * Process user dialog opening after roles check
 */
const processUserDialogOpen = (user = null) => {
    if (user) {
        isEditMode.value = true

        // Always use raw data from table
        const userData = user.raw

        // Handle different role data structures
        let role = null
        if (userData.role) {
            if (typeof userData.role === 'object' && userData.role._id) {
                // Role is an object with ID
                role = userData.role._id
            } else if (typeof userData.role === 'string') {
                // Role is already an ID
                role = userData.role
            }
        }

        // Create a deep copy and ensure all required fields exist
        editedUser.value = {
            username: '',
            email: '',
            password: '', // Clear password field
            role: role, // Use processed role
            ...JSON.parse(JSON.stringify(userData)),
        }

        // User editing mode with existing data
    } else {
        isEditMode.value = false
        // If there are roles available, preselect the first one as default
        const defaultRole = roles.value.length > 0 ? roles.value[0]._id : ''

        editedUser.value = {
            username: '',
            email: '',
            password: '',
            role: defaultRole,
        }
    }
    userDialogOpen.value = true
}

// Save user method
const saveUser = async () => {
    formError.value = null
    let valid = true

    if (userForm.value) {
        const validation = await userForm.value.validate()
        valid = validation.valid
    }

    if (!valid) {
        return
    }

    saving.value = true
    try {
        // Validate required fields
        if (!editedUser.value.username?.trim()) {
            throw new Error('Username is required')
        }
        if (!editedUser.value.email?.trim()) {
            throw new Error('Email is required')
        }
        if (!editedUser.value.role) {
            throw new Error('Role is required')
        }
        if (!isEditMode.value && !editedUser.value.password) {
            throw new Error('Password is required for new users')
        }

        // Trim whitespace from text fields
        const userData = {
            ...editedUser.value,
            username: editedUser.value.username.trim(),
            email: editedUser.value.email.trim(),
            role: editedUser.value.role,
            // Only include password if it's set
            ...(editedUser.value.password ? { password: editedUser.value.password } : {}),
        }

        if (isEditMode.value) {
            await usersStore.updateUser(userData)
            toast.success('User updated successfully')
        } else {
            await usersStore.createUser(userData)
            toast.success('User created successfully')
        }

        userDialogOpen.value = false
        await loadUsers()
    } catch (error) {
        // Error saving user handled by toast notification
        formError.value = error.message || 'Failed to save user'
        toast.error(formError.value)
    } finally {
        saving.value = false
    }
}

// Delete user methods
const confirmDeleteUser = (user) => {
    userToDelete.value = user
    deleteDialogOpen.value = true
}

const deleteUser = async () => {
    if (!userToDelete.value) return

    deleting.value = true
    try {
        await usersStore.deleteUser(userToDelete.value._id)
        toast.success(`User "${userToDelete.value.username || userToDelete.value.email}" deleted successfully`)
        deleteDialogOpen.value = false
        await loadUsers()
    } catch (error) {
        // Error deleting user handled by toast notification
        toast.error(`Failed to delete user: ${error.message || 'Unknown error'}`)
    } finally {
        deleting.value = false
    }
}

// Lifecycle hooks
onMounted(() => {
    initializeComponent()
})
</script>

<style scoped>
.admin-users {
    width: 100%;
}
</style>
