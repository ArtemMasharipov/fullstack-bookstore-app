import { authorsApi } from '@/api/authorsApi';
import { useNotificationStore } from './notification';
import { handleAsyncAction } from './utils/stateHelpers';
import { createBaseStore } from './utils/storeFactory';

/**
 * Authors store using the base store factory
 * - Uses shared logic from the factory to eliminate code duplication
 */
export const useAuthorsStore = createBaseStore({
  id: 'authors',
  api: authorsApi,
  
  // Custom state specific to authors store
  customState: () => ({
    // Map to maintain API compatibility with existing components
    list: [] // This will be synced with 'items' in the base store
  }),
  
  // Custom getters specific to authors store
  customGetters: {
    // Map base store getters to author-specific names for API compatibility
    authorsList: (state) => state.list || state.items,
    currentAuthor: (state) => state.current,
    authorsLoading: (state) => state.loading,
    authorsError: (state) => state.error
  },
  
  // Custom actions specific to authors store
  customActions: {
    /**
     * Fetch all authors
     */
    async fetchAuthors() {
      // Use the base fetchAll method but update our list property
      const authors = await this.fetchAll();
      this.list = authors; // Keep list in sync with items
      return authors;
    },
    
    /**
     * Fetch author by ID
     * @param {string} id - Author ID
     */
    async fetchAuthorById(id) {
      const author = await this.fetchById(id);
      return author;
    },
      /**
     * Create a new author
     * @param {Object} authorData - Author data
     */
    async createAuthor(authorData) {
      const notificationStore = useNotificationStore();
      
      return handleAsyncAction(this, async () => {
        try {
          const author = await this.create(authorData);
          // Ensure list stays in sync with items
          this.list = [...this.items];
          
          const authorName = authorData.name || 'Author';
          notificationStore.success(`Author "${authorName}" created successfully`);
          
          return author;
        } catch (error) {
          notificationStore.error(`Failed to create author: ${error.message}`);
          throw error;
        }
      });
    },
      /**
     * Update an existing author
     * @param {Object} authorData - Author data with ID
     */
    async updateAuthor(authorData) {
      const notificationStore = useNotificationStore();
      
      return handleAsyncAction(this, async () => {
        try {
          if (!authorData || (!authorData._id && !authorData.id)) {
            throw new Error('Author ID is required for update');
          }
          
          const id = authorData._id || authorData.id;
          const author = await this.update(id, authorData);
          // Ensure list stays in sync with items
          this.list = [...this.items];
          
          const authorName = authorData.name || author.name || 'Author';
          notificationStore.success(`Author "${authorName}" updated successfully`);
          
          return author;
        } catch (error) {
          notificationStore.error(`Failed to update author: ${error.message}`);
          throw error;
        }
      });
    },
      /**
     * Delete an author
     * @param {string} authorId - Author ID
     * @param {string} authorName - Author name for notification (optional)
     */
    async deleteAuthor(authorId, authorName = 'Author') {
      const notificationStore = useNotificationStore();
      
      return handleAsyncAction(this, async () => {
        try {
          // If authorName wasn't provided but we have the current author details, use that
          let displayName = authorName;
          if (displayName === 'Author' && this.current && 
             (this.current.id === authorId || this.current._id === authorId)) {
            displayName = this.current.name || 'Author';
          }
          
          const result = await this.delete(authorId);
          // Ensure list stays in sync with items
          this.list = [...this.items];
          
          notificationStore.info(`Author "${displayName}" deleted successfully`);
          return result;
        } catch (error) {
          notificationStore.error(`Failed to delete author: ${error.message}`);
          throw error;
        }
      });
    }
  }
});