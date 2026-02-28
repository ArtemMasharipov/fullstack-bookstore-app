import { useRoles } from '@/composables/useRoles'
import { useUsersStore } from '@/stores'
import { logger } from '@/utils/logger'
import { computed, ref } from 'vue'

/**
 * Composable for managing user operations in admin panel
 * Simplified - no useEntityDialog (PHASE 4)
 */
export function useUserManagement(options = {}) {
    const { autoLoad = true } = options

    // Stores
    const usersStore = useUsersStore()
    const { roles, loading: rolesLoading, getRoleName, getRoleColor } = useRoles({ autoLoad })

    // Local dialog state (instead of useEntityDialog)
    const userDialogOpen = ref(false)
    const deleteDialogOpen = ref(false)
    const selectedUser = ref(null)
    const formLoading = ref(false)
    const formErrors = ref({})

    // Local state
    const page = ref(1)
    const itemsPerPage = ref(10)
    const sortBy = ref([{ key: 'name', order: 'asc' }])
    const search = ref('')

    // Form state
    const editedUser = ref({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
    })

    // Computed properties
    const users = computed(() => usersStore.usersList || [])
    const loading = computed(() => usersStore.usersLoading)
    const error = computed(() => usersStore.usersError)

    const isEditMode = computed(() => !!selectedUser.value?.id)

    const totalItems = computed(() => users.value.length)

    const filteredUsers = computed(() => {
        let result = users.value

        if (search.value) {
            const query = search.value.toLowerCase()
            result = result.filter(
                (user) =>
                    user.username?.toLowerCase().includes(query) ||
                    user.email?.toLowerCase().includes(query) ||
                    user.name?.toLowerCase().includes(query)
            )
        }

        return result
    })

    const paginatedUsers = computed(() => {
        const start = (page.value - 1) * itemsPerPage.value
        const end = start + itemsPerPage.value
        return filteredUsers.value.slice(start, end)
    })

    // Methods
    const loadUsers = async () => {
        try {
            await usersStore.fetchUsers()
        } catch (error) {
            logger.error('Failed to load users', error, 'useUserManagement')
        }
    }

    const openUserDialog = (user = null) => {
        if (user) {
            editedUser.value = {
                id: user.id,
                username: user.username || '',
                email: user.email || '',
                password: '',
                confirmPassword: '',
                role: user.role || 'user',
            }
            selectedUser.value = user
        } else {
            editedUser.value = {
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'user',
            }
            selectedUser.value = null
        }
        formErrors.value = {}
        userDialogOpen.value = true
    }

    const closeUserDialog = () => {
        userDialogOpen.value = false
        selectedUser.value = null
        editedUser.value = {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'user',
        }
        formErrors.value = {}
    }

    const confirmDeleteUser = (user) => {
        selectedUser.value = user
        deleteDialogOpen.value = true
    }

    const closeDeleteDialog = () => {
        deleteDialogOpen.value = false
        selectedUser.value = null
    }

    const saveUser = async () => {
        formLoading.value = true
        formErrors.value = {}

        try {
            // Basic validation
            const errors = {}
            if (!editedUser.value.username) errors.username = 'Username is required'
            if (!editedUser.value.email) errors.email = 'Email is required'
            if (!isEditMode.value && !editedUser.value.password) errors.password = 'Password is required'
            if (!isEditMode.value && editedUser.value.password !== editedUser.value.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match'
            }

            if (Object.keys(errors).length > 0) {
                formErrors.value = errors
                return
            }

            const userData = {
                username: editedUser.value.username,
                email: editedUser.value.email,
                role: editedUser.value.role,
            }

            if (!isEditMode.value) {
                userData.password = editedUser.value.password
            }

            if (isEditMode.value) {
                await usersStore.updateUser(editedUser.value.id, userData)
                logger.info(`User "${editedUser.value.username}" updated successfully`, 'useUserManagement')
            } else {
                await usersStore.createUser(userData)
                logger.info(`User "${editedUser.value.username}" created successfully`, 'useUserManagement')
            }

            closeUserDialog()
            await loadUsers()
        } catch (error) {
            logger.error('Failed to save user', error, 'useUserManagement')
            formErrors.value = { general: error.message || 'Failed to save user' }
        } finally {
            formLoading.value = false
        }
    }

    const deleteUser = async () => {
        if (!selectedUser.value) return

        formLoading.value = true
        try {
            await usersStore.deleteUser(selectedUser.value.id)
            logger.info(`User "${selectedUser.value.username}" deleted successfully`, 'useUserManagement')
            closeDeleteDialog()
            await loadUsers()
        } catch (error) {
            logger.error('Failed to delete user', error, 'useUserManagement')
        } finally {
            formLoading.value = false
        }
    }

    const updatePage = (newPage) => {
        page.value = newPage
    }

    const updateItemsPerPage = (newItemsPerPage) => {
        itemsPerPage.value = newItemsPerPage
        page.value = 1
    }

    const updateSortBy = (sortField) => {
        sortBy.value = sortField
    }

    const updateSearch = (query) => {
        search.value = query
        page.value = 1
    }

    const resetFilters = () => {
        search.value = ''
        page.value = 1
    }

    if (autoLoad) {
        loadUsers()
    }

    return {
        // State
        users: paginatedUsers,
        allUsers: users,
        loading,
        error,
        roles,
        rolesLoading,

        // Dialog state
        userDialogOpen,
        deleteDialogOpen,
        isEditMode,
        editedUser,
        selectedUser,
        formLoading,
        formErrors,

        // Table state
        page,
        itemsPerPage,
        sortBy,
        search,
        totalItems,

        // Methods
        loadUsers,
        openUserDialog,
        closeUserDialog,
        confirmDeleteUser,
        closeDeleteDialog,
        saveUser,
        deleteUser,

        // Table handlers
        updatePage,
        updateItemsPerPage,
        updateSortBy,
        updateSearch,
        resetFilters,

        // Role helpers
        getRoleName,
        getRoleColor,
    }
}
