import { User as UserEntity } from '../../domain/entities/User.js'
import { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { MongooseCRUDManager } from '../database/MongooseCRUDManager.js'
import Role from '../schemas/RoleSchema.js'
import User from '../schemas/UserSchema.js'

export class MongoUserRepository extends IUserRepository {
  constructor() {
    super()
    this.crudManager = new MongooseCRUDManager(User)
  }

  async findAll() {
    const users = await this.crudManager.findAll({}, ['role'])
    return users.map(user => this._mapToEntity(user))
  }

  async findById(id) {
    const user = await this.crudManager.findById(id, ['role'])
    return user ? this._mapToEntity(user) : null
  }
  async findByEmail(email) {
    const user = await this.crudManager.findOne({ email }, ['role'])
    return user ? this._mapToEntity(user) : null
  }

  async findByUsername(username) {
    const user = await this.crudManager.findOne({ username }, ['role'])
    return user ? this._mapToEntity(user) : null
  }

  async create(userData) {
    const { roleName, ...userFields } = userData

    const role = await Role.findOne({ name: roleName })
    if (!role) {
      throw new Error(`Role not found: ${roleName}`)
    }

    const existingUser = await this.crudManager.findOne({
      email: userFields.email,
    })
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const user = await this.crudManager.create({
      ...userFields,
      role: role._id,
    })

    return this._mapToEntity(user)
  }

  async update(id, updateData) {
    const user = await this.crudManager.update(id, updateData)
    return user ? this._mapToEntity(user) : null
  }

  async delete(id) {
    const user = await this.crudManager.delete(id)
    return user ? this._mapToEntity(user) : null
  }

  async findWithRole(id) {
    const user = await this.crudManager.findById(id, ['role'])
    return user ? this._mapToEntity(user) : null
  }

  _mapToEntity(mongoDoc) {
    return UserEntity.create({
      id: mongoDoc._id.toString(),
      username: mongoDoc.username,
      email: mongoDoc.email,
      password: mongoDoc.password,
      role: mongoDoc.role,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    })
  }
}
