export const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  READ: 'read',
};

export const RESOURCE_TYPES = {
  AUTHOR: 'author',
  BOOK: 'book',
  USER: 'user',
};

export const generatePermission = (action, resource) => `${action}:${resource}`;

export const ALL_PERMISSIONS = Object.keys(ACTION_TYPES).flatMap((action) =>
  Object.keys(RESOURCE_TYPES).map((resource) =>
    generatePermission(action, resource),
  ),
);
