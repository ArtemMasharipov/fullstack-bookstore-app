export class Role {
  constructor({ id, name, permissions = [], createdAt, updatedAt }) {
    this.id = id
    this.name = name
    this.permissions = permissions
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static create(data) {
    return new Role(data)
  }

  addPermission(permission) {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission)
    }
    return this
  }

  removePermission(permission) {
    this.permissions = this.permissions.filter(p => p !== permission)
    return this
  }

  hasPermission(permission) {
    return this.permissions.includes(permission)
  }

  isAdmin() {
    return this.name === 'admin'
  }
}
