import {
  generatePermission,
  ALL_PERMISSIONS,
  ACTION_TYPES,
  RESOURCE_TYPES,
} from './permissionsConst.mjs';

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
});

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: ALL_PERMISSIONS,
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
