import {
    ACTION_TYPES,
    ALL_PERMISSIONS,
    generatePermission,
    RESOURCE_TYPES,
} from './permissionsConst.mjs';

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
});

// Create admin-specific permissions
const ADMIN_SPECIFIC_PERMISSIONS = [
  generatePermission(ACTION_TYPES.ADMIN, RESOURCE_TYPES.ACCESS) // admin:access permission
];

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: [...ALL_PERMISSIONS, ...ADMIN_SPECIFIC_PERMISSIONS], // Add admin-specific permissions
  [ROLES.USER]: [
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.BOOK),
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.AUTHOR),
  ],
  [ROLES.GUEST]: [
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.BOOK),
    generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.ORDER),
  ],
});

export const getRolePermissions = (role) => ROLE_PERMISSIONS[role] || [];
