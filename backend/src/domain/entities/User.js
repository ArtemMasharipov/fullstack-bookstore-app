export class User {
  constructor({ id, username, email, password, role, createdAt, updatedAt }) {
    this.id = id
    this.username = username
    this.email = email
    this.password = password
    this.role = role
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static create(data) {
    return new User(data)
  }

  update(data) {
    Object.assign(this, { ...data, updatedAt: new Date() })
    return this
  }

  isAdmin() {
    return this.role && this.role.name === 'admin'
  }

  hasPermission(permission) {
    return (
      this.role &&
      this.role.permissions &&
      this.role.permissions.includes(permission)
    )
  }
}
