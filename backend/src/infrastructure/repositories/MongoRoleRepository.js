import { Role as RoleEntity } from '../../domain/entities/Role.js'
import { IRoleRepository } from '../../domain/repositories/IRoleRepository.js'
import { ROLES, getRolePermissions } from '../../shared/constants/roleConfig.js'
import { MongooseCRUDManager } from '../database/MongooseCRUDManager.js'
import Role from '../schemas/RoleSchema.js'

export class MongoRoleRepository extends IRoleRepository {
  constructor() {
    super()
    this.crudManager = new MongooseCRUDManager(Role)
  }

  async findAll() {
    const roles = await this.crudManager.findAll()
    return roles.map(role => this._mapToEntity(role))
  }

  async findById(id) {
    const role = await this.crudManager.findById(id)
    return role ? this._mapToEntity(role) : null
  }

  async findByName(name) {
    const role = await this.crudManager.findOne({ name })
    return role ? this._mapToEntity(role) : null
  }

  async create(roleData) {
    const role = await this.crudManager.create(roleData)
    return this._mapToEntity(role)
  }

  async update(id, updateData) {
    const role = await this.crudManager.update(id, updateData)
    return role ? this._mapToEntity(role) : null
  }

  async delete(id) {
    const role = await this.crudManager.delete(id)
    return role ? this._mapToEntity(role) : null
  }

  async initializeDefaultRoles() {
    const defaultRoles = Object.values(ROLES)
    const results = []

    for (const roleName of defaultRoles) {
      const permissions = getRolePermissions(roleName)
      const result = await this._initializeRole(roleName, permissions)
      results.push(result)
    }

    return results
  }

  async _initializeRole(roleName, permissions) {
    try {
      const existingRole = await this.crudManager.findOne({ name: roleName })

      if (existingRole) {
        const updatedRole = await this.crudManager.update(existingRole._id, {
          name: roleName,
          permissions,
        })
        return this._mapToEntity(updatedRole)
      } else {
        const newRole = await this.crudManager.create({
          name: roleName,
          permissions,
        })
        return this._mapToEntity(newRole)
      }
    } catch (error) {
      throw new Error(`Failed to initialize role ${roleName}: ${error.message}`)
    }
  }

  _mapToEntity(mongoDoc) {
    return RoleEntity.create({
      id: mongoDoc._id.toString(),
      name: mongoDoc.name,
      permissions: mongoDoc.permissions,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    })
  }
}
