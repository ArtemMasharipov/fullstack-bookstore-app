import { rolesApi } from '@/services/api/rolesApi'
import { logger } from '@/utils/logger'
import { computed, ref } from 'vue'

/**
 * Composable for managing roles data
 * Provides centralized roles management with caching and role mapping
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Roles state and methods
 */
export function useRoles(options = {}) {
  const { autoLoad = false } = options

  // State
  const roles = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed properties
  const roleMap = computed(() => {
    const map = {}
    roles.value.forEach(role => {
      if (role._id && role.name) {
        map[role._id] = role.name
      }
    })
    return map
  })

  const roleOptions = computed(() => {
    return roles.value.map(role => ({
      id: role._id,
      name: capitalizeFirst(role.name),
      value: role._id
    }))
  })

  /**
   * Load roles from API
   */
  const loadRoles = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await rolesApi.fetchAll()
      
      // Handle different response formats
      if (Array.isArray(response)) {
        roles.value = response
      } else if (response?.data && Array.isArray(response.data)) {
        roles.value = response.data
      } else {
        roles.value = []
        logger.warn('Unexpected roles API response format', response, 'useRoles')
      }
      
      logger.info(`Loaded ${roles.value.length} roles`, null, 'useRoles')
    } catch (err) {
      error.value = err
      roles.value = []
      logger.error('Failed to load roles', err, 'useRoles')
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get role name by ID
   * @param {string} roleId - Role ID
   * @returns {string} Role name or 'Unknown'
   */
  const getRoleName = (roleId) => {
    if (!roleId) return 'Unknown'
    return roleMap.value[roleId] || 'Unknown'
  }

  /**
   * Get role color for UI display
   * @param {string} roleId - Role ID
   * @returns {string} Color name
   */
  const getRoleColor = (roleId) => {
    const roleName = getRoleName(roleId).toLowerCase()
    
    switch (roleName) {
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
   * Capitalize first letter of a string
   * @param {string} str - Input string
   * @returns {string} Capitalized string
   */
  const capitalizeFirst = (str) => {
    if (!str || typeof str !== 'string') return 'Unknown'
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  /**
   * Clear roles data
   */
  const clearRoles = () => {
    roles.value = []
    error.value = null
  }

  // Auto-load if requested
  if (autoLoad) {
    loadRoles()
  }

  return {
    // State
    roles,
    loading,
    error,
    
    // Computed
    roleMap,
    roleOptions,
    
    // Methods
    loadRoles,
    getRoleName,
    getRoleColor,
    clearRoles
  }
}
