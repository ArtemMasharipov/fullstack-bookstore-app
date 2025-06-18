export const ACTION_TYPES = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
}

export const RESOURCE_TYPES = {
  BOOK: 'BOOK',
  AUTHOR: 'AUTHOR',
  USER: 'USER',
  ROLE: 'ROLE',
  CART: 'CART',
  ORDER: 'ORDER',
}

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
}

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

export const generatePermission = (action, resource) => {
  return `${action}_${resource}`
}

// All permissions list
export const ALL_PERMISSIONS = [
  generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.BOOK),
  generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.BOOK),
  generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.BOOK),
  generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.BOOK),
  generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.AUTHOR),
  generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.AUTHOR),
  generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.AUTHOR),
  generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.AUTHOR),
  generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.USER),
  generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.USER),
  generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.USER),
  generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.USER),
  generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.ROLE),
  generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.ROLE),
  generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.ROLE),
  generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.ROLE),
  generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.CART),
  generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.CART),
  generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.ORDER),
  generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.ORDER),
  generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.ORDER),
]
