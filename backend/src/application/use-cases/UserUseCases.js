import { UserDomainService } from '../../domain/services/UserDomainService.js'
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository.js'

export class UserUseCases {
  constructor() {
    this.userRepository = new MongoUserRepository()
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll()
    return users.map(user => UserDomainService.sanitizeUserData(user))
  }

  async getUserById(id) {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new Error('User not found')
    }
    return UserDomainService.sanitizeUserData(user)
  }

  async getUserByEmail(email) {
    const user = await this.userRepository.findByEmail(email)
    return user ? UserDomainService.sanitizeUserData(user) : null
  }
  async createUser(userData) {
    UserDomainService.validateUserCreation(userData)

    const existingUser = await this.userRepository.findByEmail(userData.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const hashedPassword = await UserDomainService.hashPassword(
      userData.password
    )

    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    })

    return UserDomainService.sanitizeUserData(user)
  }
  async updateUser(id, updateData) {
    UserDomainService.validateUserUpdate(updateData)

    if (updateData.password) {
      updateData.password = await UserDomainService.hashPassword(
        updateData.password
      )
    }

    const user = await this.userRepository.update(id, updateData)
    if (!user) {
      throw new Error('User not found')
    }

    return UserDomainService.sanitizeUserData(user)
  }

  async deleteUser(id) {
    const user = await this.userRepository.delete(id)
    if (!user) {
      throw new Error('User not found')
    }
    return UserDomainService.sanitizeUserData(user)
  }

  async authenticateUser(email, password) {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValid = await UserDomainService.validatePassword(
      password,
      user.password
    )
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    return UserDomainService.sanitizeUserData(user)
  }
}

// Legacy exports for backward compatibility
export class CreateUserUseCase {
  constructor(userRepository, roleRepository) {
    this.userRepository = userRepository
    this.roleRepository = roleRepository
  }

  async execute(userData) {
    UserDomainService.validateUserCreation(userData)

    const existingUser = await this.userRepository.findByEmail(userData.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const hashedPassword = await UserDomainService.hashPassword(
      userData.password
    )

    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    })

    return UserDomainService.sanitizeUserData(user)
  }
}

export class GetAllUsersUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository
  }

  async execute() {
    const users = await this.userRepository.findAll()
    return users.map(user => UserDomainService.sanitizeUserData(user))
  }
}

export class GetUserByIdUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository
  }

  async execute(id) {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new Error('User not found')
    }
    return UserDomainService.sanitizeUserData(user)
  }
}

export class UpdateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository
  }

  async execute(id, updateData) {
    UserDomainService.validateUserUpdate(updateData)

    if (updateData.password) {
      updateData.password = await UserDomainService.hashPassword(
        updateData.password
      )
    }

    const user = await this.userRepository.update(id, updateData)
    if (!user) {
      throw new Error('User not found')
    }

    return UserDomainService.sanitizeUserData(user)
  }
}

export class DeleteUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository
  }

  async execute(id) {
    const user = await this.userRepository.delete(id)
    if (!user) {
      throw new Error('User not found')
    }
    return UserDomainService.sanitizeUserData(user)
  }
}

export class AuthenticateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository
  }

  async execute(email, password) {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValid = await UserDomainService.validatePassword(
      password,
      user.password
    )
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    return UserDomainService.sanitizeUserData(user)
  }
}
