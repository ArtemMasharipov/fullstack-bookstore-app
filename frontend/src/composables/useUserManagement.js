import { useEntityDialog } from '@/composables/useEntityDialog'
import { useRoles } from '@/composables/useRoles'
import { useUsersStore } from '@/store'
import { logger } from '@/utils/logger'
import { computed, ref } from 'vue'

/**
 * Composable for managing user operations in admin panel
 * Provides centralized user management logic with roles and dialog handling
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} User management state and methods
 */
export function useUserManagement(options = {}) {
    const { autoLoad = true } = options

    // Stores
    const usersStore = useUsersStore()
    const { roles, loading: rolesLoading, loadRoles, getRoleName, getRoleColor } = useRoles({ autoLoad })

    // Dialog management
    const { dialogs, selectedItem, formLoading, formErrors, openDialog, closeDialogs, setFormLoading, setFormErrors, clearFormErrors } = useEntityDialog({ entityName: 'user' })

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
        role: 'user'
    })

    // Computed properties
    const users = computed(() => usersStore.usersList || [])
    const loading = computed(() => usersStore.usersLoading)
    const error = computed(() => usersStore.usersError)

    const isEditMode = computed(() => !!selectedItem.value?.id)
    const userDialogOpen = computed(() => dialogs.create || dialogs.edit)
    const deleteDialogOpen = computed(() => dialogs.delete)

    const totalItems = computed(() => users.value.length)

    const filteredUsers = computed(() => {
        let result = users.value

        // Search filter
        if (search.value) {
            const query = search.value.toLowerCase()
            result = result.filter(user =>
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
            // Edit mode
            editedUser.value = {
                id: user.id,
                username: user.username || '',
                email: user.email || '',
                password: '',
                confirmPassword: '',
                role: user.role || 'user'
            }
            openDialog('edit', user)
        } else {
            // Create mode
            editedUser.value = {
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'user'
            }
            openDialog('create')
        }
        clearFormErrors()
    }

    const closeUserDialog = () => {
        closeDialogs()
        editedUser.value = {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'user'
        }
        clearFormErrors()
    }

    const confirmDeleteUser = (user) => {
        openDialog('delete', user)
    }

    const closeDeleteDialog = () => {
        closeDialogs()
    }

    const saveUser = async () => {
        setFormLoading(true)
        setFormErrors({})

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
                setFormErrors(errors)
                return
            }

            // Prepare user data
            const userData = {
                username: editedUser.value.username,
                email: editedUser.value.email,
                role: editedUser.value.role
            }

            if (!isEditMode.value) {
                userData.password = editedUser.value.password
            }

            // Save user
            if (isEditMode.value) {
                await usersStore.updateUser(editedUser.value.id, userData)
                logger.info(`User "${editedUser.value.username}" updated successfully`, 'useUserManagement')
            } else {
                await usersStore.createUser(userData)
                logger.info(`User "${editedUser.value.username}" created successfully`, 'useUserManagement')
            }

            closeUserDialog()
            await loadUsers() // Refresh the list
        } catch (error) {
            logger.error('Failed to save user', error, 'useUserManagement')
            setFormErrors({ general: error.message || 'Failed to save user' })
        } finally {
            setFormLoading(false)
        }
    }

    const deleteUser = async () => {
        if (!selectedItem.value) return

        setFormLoading(true)
        try {
            await usersStore.deleteUser(selectedItem.value.id)
            logger.info(`User "${selectedItem.value.username}" deleted successfully`, 'useUserManagement')
            closeDeleteDialog()
            await loadUsers() // Refresh the list
        } catch (error) {
            logger.error('Failed to delete user', error, 'useUserManagement')
        } finally {
            setFormLoading(false)
        }
    }

    // Table event handlers
    const updatePage = (newPage) => {
        page.value = newPage
    }

    const updateItemsPerPage = (newItemsPerPage) => {
        itemsPerPage.value = newItemsPerPage
        page.value = 1 // Reset to first page
    }

    const updateSortBy = (sortField) => {
        sortBy.value = sortField
    }

    const updateSearch = (query) => {
        search.value = query
        page.value = 1 // Reset to first page
    }

    const resetFilters = () => {
        search.value = ''
        page.value = 1
    }

    // Auto-load users if requested
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
        selectedUser: selectedItem,
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
        getRoleColor
    }
}
