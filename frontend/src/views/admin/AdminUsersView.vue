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
                    <v-form ref="userForm" validate-on="submit">
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="editedUser.username"
                                    label="Username"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[(v) => !!v || 'Username is required']"
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
                    </v-form>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="userDialogOpen = false">Cancel</v-btn>
                    <v-btn color="primary" :loading="saving" @click="saveUser"> Save </v-btn>
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

<script>
import AdminDataTable from '@/components/features/admin/AdminDataTable.vue'
import { useUsersStore } from '@/store'

export default {
    name: 'AdminUsersView',
    components: {
        AdminDataTable,
    },

    data() {
        return {
            // Table state
            headers: [
                { title: 'Username', align: 'start', key: 'username' },
                { title: 'Email', align: 'start', key: 'email' },
                { title: 'Role', align: 'center', key: 'role' },
                { title: 'Registered', align: 'start', key: 'createdAt' },
                { title: 'Actions', align: 'center', key: 'actions', sortable: false },
            ],

            page: 1,
            itemsPerPage: 10,
            sortBy: [{ key: 'username', order: 'asc' }],
            search: '',
            totalItems: 0,

            // Form state
            userDialogOpen: false,
            deleteDialogOpen: false,
            isEditMode: false,
            editedUser: null,
            saving: false,
            deleting: false,
            userToDelete: null,

            // Default user data
            roles: [],
            
            // Dynamic role mapping from API
            dynamicRoleMap: {},
        }
    },

    computed: {
        // Users list with computed properties
        users() {
            const usersStore = useUsersStore()
            return usersStore.usersList || []
        },

        // Store states
        loading() {
            return useUsersStore().loading
        },
        
        /**
         * Format roles for display in the dropdown
         */
        availableRoles() {
            // Use roles loaded from API
            return this.roles.map(role => ({
                id: role._id,
                name: this.capitalizeFirst(role.name)
            }));
        },
        
        /**
         * Map of role IDs to their names for easy reference
         * Based on roles loaded from API
         */
        roleNameMap() {
            // Use only the dynamic roles loaded from API
            return this.dynamicRoleMap || {};
        },
    },

    mounted() {
        this.initializeComponent();
    },

    methods: {
        /**
         * Initialize the component data
         */
        async initializeComponent() {
            try {
                // First load roles to ensure we have them for display
                await this.loadRoles();
                
                // Then load user data 
                await this.loadUsers();
                
                console.log('Component initialized with roles:', 
                    this.roles.length, 
                    'Available role mappings:', 
                    Object.keys(this.roleNameMap).length);
            } catch (error) {
                console.error('Failed to initialize component:', error);
            }
        },
        
        // Data loading
        async loadUsers() {
            try {
                const usersStore = useUsersStore()
                await usersStore.fetchUsers()
                this.totalItems = usersStore.usersList?.length || 0
            } catch (error) {
                console.error('Failed to load users:', error)
            }
        },

        async loadRoles() {
            try {
                // Load roles from API
                const response = await fetch('/api/v1/roles')
                
                if (!response.ok) {
                    console.warn(`API returned status ${response.status}: ${response.statusText}`);
                    // Initialize with empty roles if API fails
                    this.roles = [];
                    return;
                }
                
                const rolesData = await response.json()
                
                // Update our data if roles were successfully loaded
                if (rolesData && Array.isArray(rolesData.data)) {
                    // 1. Store full role objects for the dropdown
                    this.roles = rolesData.data;
                    
                    // 2. Create a map for role ID -> name resolution
                    const roleMap = {};
                    rolesData.data.forEach(role => {
                        if (role._id && role.name) {
                            roleMap[role._id] = role.name.toLowerCase();
                        }
                    });
                    
                    // Store the role information for future use
                    this.dynamicRoleMap = roleMap;
                    console.log('Loaded roles from API:', this.roles);
                } else {
                    console.warn('API returned unexpected format for roles');
                }
            } catch (error) {
                console.error('Failed to load roles:', error);
                // Initialize with empty roles if API fails
                this.roles = [];
            }
        },

        // Table methods
        updatePage(page) {
            this.page = page
        },

        updateItemsPerPage(itemsPerPage) {
            this.itemsPerPage = itemsPerPage
        },

        updateSortBy(sortBy) {
            this.sortBy = sortBy
        },

        updateSearch(search) {
            this.search = search
        },

        resetFilters() {
            this.page = 1
            this.search = ''
            this.sortBy = [{ key: 'username', order: 'asc' }]
        },

        getRoleColor(role) {
            // Convert role name to lowercase for case-insensitive matching
            const roleLower = role ? role.toLowerCase() : '';
            
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
        },
        
        /**
         * Get role name from user item, handling different data structures
         * @param {Object} item - User item from table
         * @returns {String} Role name with proper capitalization
         */
        getRoleName(item) {
            // The raw property may contain the data we need
            const userData = item.raw || item;
            
            // Case 1: Role is an object with a name property
            if (userData?.role && typeof userData.role === 'object' && userData.role.name) {
                const name = userData.role.name;
                return this.capitalizeFirst(name);
            }
            
            // Case 2: Role is a string (role ID or direct role name)
            if (userData?.role && typeof userData.role === 'string') {
                // Look up in role map first
                const mappedName = this.mapRoleIdToName(userData.role);
                
                if (mappedName && mappedName !== 'Unknown') {
                    return this.capitalizeFirst(mappedName);
                }
                
                // If not found in map, return just the role string with capitalization
                // This handles the case where role is already a name string, not an ID
                return this.capitalizeFirst(userData.role);
            }
            
            return 'Unknown';
        },
        
        /**
         * Capitalize the first letter of a string
         * @param {String} str - Input string
         * @returns {String} Capitalized string
         */
        capitalizeFirst(str) {
            if (!str || typeof str !== 'string') return 'Unknown';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },
        
        /**
         * Map role ID to a human-readable name
         * @param {String} roleId - Role ID or role name
         * @returns {String} Human-readable role name or null if not found
         */
        mapRoleIdToName(roleId) {
            // Simple lookup in our role mapping
            return this.roleNameMap[roleId] || null;
        },

        // User dialog methods
        openUserDialog(user = null) {
            // Check if roles are loaded before opening dialog
            if (this.roles.length === 0) {
                // Reload roles if they're not available
                this.loadRoles().then(() => {
                    if (this.roles.length === 0) {
                        // Still no roles after reload attempt
                        alert('Cannot open user dialog: Roles data is not available. Please try again later.');
                        return;
                    }
                    // If roles are loaded successfully, continue opening dialog
                    this.processUserDialogOpen(user);
                });
            } else {
                // Roles are already loaded, continue opening dialog
                this.processUserDialogOpen(user);
            }
        },
        
        /**
         * Process user dialog opening after roles check
         */
        processUserDialogOpen(user = null) {
            if (user) {
                this.isEditMode = true
                
                // Handle different role data structures
                let role = null;
                if (user.role) {
                    if (typeof user.role === 'object' && user.role._id) {
                        // Role is an object with ID
                        role = user.role._id;
                    } else if (typeof user.role === 'string') {
                        // Role is already an ID
                        role = user.role;
                    }
                }
                
                this.editedUser = {
                    ...user,
                    password: '', // Don't show existing password
                    role: role,
                }
                
                console.log('Editing user with role:', role, 'Role name:', this.getRoleName({raw: user}));
            } else {
                this.isEditMode = false
                // If there are roles available, preselect the first one as default
                const defaultRole = this.roles.length > 0 ? this.roles[0]._id : '';
                
                this.editedUser = {
                    username: '',
                    email: '',
                    password: '',
                    role: defaultRole,
                }
            }
            this.userDialogOpen = true
        },

        // Save user method
        async saveUser() {
            if (this.$refs.userForm && !this.$refs.userForm.validate().valid) {
                return
            }

            this.saving = true
            try {
                const usersStore = useUsersStore()
                if (this.isEditMode) {
                    await usersStore.updateUser(this.editedUser)
                } else {
                    await usersStore.createUser(this.editedUser)
                }
                this.userDialogOpen = false
                await this.loadUsers()
            } catch (error) {
                console.error('Error saving user:', error)
            } finally {
                this.saving = false
            }
        },

        // Delete user methods
        confirmDeleteUser(user) {
            this.userToDelete = user
            this.deleteDialogOpen = true
        },

        async deleteUser() {
            if (!this.userToDelete) return

            this.deleting = true
            try {
                const usersStore = useUsersStore()
                await usersStore.deleteUser(this.userToDelete._id)
                this.deleteDialogOpen = false
                await this.loadUsers()
            } catch (error) {
                console.error('Error deleting user:', error)
            } finally {
                this.deleting = false
            }
        },
    },
}
</script>

<style scoped>
.admin-users {
    width: 100%;
}
</style>
