import {
  ACTION_TYPES,
  RESOURCE_TYPES,
  ROLES,
  generatePermission,
} from './permissions.js'

// Role configurations with their permissions
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Books
    generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.BOOK),
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.BOOK),
    generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.BOOK),
    generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.BOOK),
    // Authors
    generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.AUTHOR),
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.AUTHOR),
    generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.AUTHOR),
    generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.AUTHOR),
    // Users
    generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.USER),
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.USER),
    generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.USER),
    generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.USER),
    // Roles
    generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.ROLE),
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.ROLE),
    generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.ROLE),
    generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.ROLE),
    // Orders
    generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.ORDER),
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.ORDER),
    generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.ORDER),
  ],
  [ROLES.USER]: [
    // Books (read only)
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.BOOK),
    // Authors (read only)
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.AUTHOR),
    // Cart
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.CART),
    generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.CART),
    // Orders
    generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.ORDER),
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.ORDER),
  ],
}

export const getRolePermissions = roleName => {
  return ROLE_PERMISSIONS[roleName] || []
}

export { ACTION_TYPES, RESOURCE_TYPES, ROLES, generatePermission }
