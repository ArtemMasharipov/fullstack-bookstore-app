import { usersApi } from '@/api/usersApi';
import { toast, toastHelpers } from '.';
import { handleAsyncAction } from './utils/stateHelpers';
import { createBaseStore } from './utils/storeFactory';

/**
 * Users store using the base store factory
 * - Uses shared logic from the factory to eliminate code duplication
 * - Preserves specific user store functionality
 */
export const useUsersStore = createBaseStore({
  id: 'users',
  api: usersApi,
  
  // Custom state specific to users store
  customState: () => ({
    // Map to maintain API compatibility with existing components
    list: [] // This will be synced with 'items' in the base store
  }),
  
  // Custom getters specific to users store
  customGetters: {
    // Map base store getters to user-specific names for API compatibility
    usersList: (state) => state.list || state.items,
    currentUser: (state) => state.current,
    usersLoading: (state) => state.loading,
    usersError: (state) => state.error,
    
    // Custom getter that is specific to this store
    getUserById: (state) => (id) => (state.list || state.items).find((user) => user.id === id)
  },
  
  // Custom actions specific to users store
  customActions: {
    /**
     * Fetch all users
     */
    async fetchUsers() {
      const users = await toastHelpers.handleLoad({
        entityName: 'Пользователи',
        operation: () => this.fetchAll(),
        silent: true
      });
      
      this.list = users; // Keep list in sync with items
      return users;
    },
    
    /**
     * Fetch user by ID
     * @param {string} id - User ID
     */
    async fetchUserById(id) {
      return this.fetchById(id);
    },
    
    /**
     * Create a new user
     * @param {Object} userData - User data
     */
    async createUser(userData) {
      const userName = userData.name || userData.username || 'User';
      
      return handleAsyncAction(this, async () => {
        return toastHelpers.handleCreate({
          entityName: 'Пользователь',
          displayName: userName,
          operation: async () => {
            const user = await this.create(userData);
            // Ensure list stays in sync with items
            this.list = [...this.items];
            return user;
          }
        });
      });
    },
    
    /**
     * Update an existing user
     * @param {Object} params - Parameters object
     * @param {string} params.id - User ID
     * @param {Object} params.userData - Updated user data
     */
    async updateUser({ id, userData }) {
      const userName = userData.name || userData.username || 'User';
      
      return handleAsyncAction(this, async () => {
        return toastHelpers.handleUpdate({
          entityName: 'Пользователь',
          displayName: userName,
          operation: async () => {
            const user = await this.update(id, userData);
            // Ensure list stays in sync with items
            this.list = [...this.items];
            return user;
          }
        });
      });
    },
    
    /**
     * Delete a user
     * @param {string} id - User ID
     * @param {string} userName - User name for notification (optional)
     */
    async deleteUser(id, userName = 'User') {
      return handleAsyncAction(this, async () => {
        // If userName wasn't provided but we have the current user details, use that
        let displayName = userName;
        if (displayName === 'User' && this.current && this.current.id === id) {
          displayName = this.current.name || this.current.username || 'User';
        }
        
        return toastHelpers.handleDelete({
          entityName: 'Пользователь',
          displayName,
          operation: async () => {
            const result = await this.delete(id);
            // Ensure list stays in sync with items
            this.list = [...this.items];
            return result;
          }
        });
      });
    }
  }
});