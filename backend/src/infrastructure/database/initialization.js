import { ROLES, getRolePermissions } from '../../shared/constants/roleConfig.js'
import { MongoRoleRepository } from '../repositories/MongoRoleRepository.js'
import { MongoUserRepository } from '../repositories/MongoUserRepository.js'

const roleRepository = new MongoRoleRepository()
const userRepository = new MongoUserRepository()

export const initializeDefaultData = async () => {
  try {
    await initializeDefaultRoles()
    await createAdminUser()
  } catch (error) {
    console.error('Failed to initialize default data:', error)
    throw error
  }
}

const initializeDefaultRoles = async () => {
  try {
    const roles = Object.values(ROLES)

    for (const roleName of roles) {
      const permissions = getRolePermissions(roleName)
      await initializeRole(roleName, permissions)
    }
  } catch (error) {
    console.error('Failed to initialize roles:', error)
    throw error
  }
}

const initializeRole = async (roleName, permissions) => {
  try {
    const existingRole = await roleRepository.findByName(roleName)

    if (!existingRole) {
      await roleRepository.create({
        name: roleName,
        permissions,
      })
    } else {
      await roleRepository.update(existingRole.id, { permissions })
    }
  } catch (error) {
    console.error(`Failed to initialize role ${roleName}:`, error)
    throw error
  }
}

const createAdminUser = async () => {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@bookstore.com'
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin'

    const existingAdminByEmail = await userRepository.findByEmail(adminEmail)
    const existingAdminByUsername = await userRepository.findByUsername(
      adminUsername
    )

    if (!existingAdminByEmail && !existingAdminByUsername) {
      const adminRole = await roleRepository.findByName(ROLES.ADMIN)

      if (adminRole) {
        await userRepository.create({
          username: adminUsername,
          email: adminEmail,
          password: adminPassword,
          roleName: ROLES.ADMIN,
        })
      }
    }
  } catch (error) {
    console.error('Failed to create admin user:', error)
    if (!error.message.includes('E11000 duplicate key error')) {
      throw error
    }
  }
}
