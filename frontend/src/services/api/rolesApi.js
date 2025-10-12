import { createApiClient } from './apiFactory'

/**
 * Roles API service
 * Provides centralized access to roles-related API endpoints
 * Follows the same pattern as other API services in the project
 */
export const rolesApi = createApiClient('roles', {
  // Additional custom methods can be added here if needed
  // For now, we use the default CRUD operations from createApiClient
})
