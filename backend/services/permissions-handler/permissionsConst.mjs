export const ACTION_TYPES = {
  READ: 'read',
  WRITE: 'write',
  UPDATE: 'update',
  DELETE: 'delete',
};

export const RESOURCE_TYPES = {
  BOOK: 'book',
  AUTHOR: 'author',
  ORDER: 'order',
};

export function generatePermission(action, resource) {
  return `${action}:${resource}`.toLowerCase();
}

export const ALL_PERMISSIONS = Object.keys(ACTION_TYPES).flatMap((action) =>
  Object.keys(RESOURCE_TYPES).map((resource) =>
    generatePermission(action, resource),
  ),
);
