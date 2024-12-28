export const ACTION_TYPES = Object.freeze({
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
});

export const RESOURCE_TYPES = Object.freeze({
  AUTHOR: 'author',
  BOOK: 'book',
  USER: 'user',
  ORDER: 'order',
});

export const generatePermission = (action, resource) =>
  `${action}:${resource}`.toLowerCase();

export const ALL_PERMISSIONS = Object.freeze(
  Object.keys(ACTION_TYPES).flatMap((action) =>
    Object.keys(RESOURCE_TYPES).map((resource) =>
      generatePermission(action, resource),
    ),
  ),
);
