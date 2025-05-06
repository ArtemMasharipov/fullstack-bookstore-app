import MongooseCRUDManager from '../MongooseCRUDManager.mjs';
import Role from './roleModel.mjs';
import UsersDBService from '../user/UsersDBService.mjs';
import {
  ROLES,
  getRolePermissions,
} from '../../../../services/permissions-handler/roleConfig.mjs';

class RolesDBService extends MongooseCRUDManager {
  constructor() {
    super(Role);
    this.defaultRoles = Object.values(ROLES);
  }

  async initializeDefaultRolesAndAdmin() {
    try {
      await this.initializeDefaultRoles();
      await this.createAdminUser();
      console.log('Roles and admin user initialized successfully');
    } catch (error) {
      throw new Error('Initialization failed: ' + error.message);
    }
  }

  async initializeDefaultRoles() {
    try {
      const roles = await Promise.all(
        this.defaultRoles.map((roleName) => this.initializeRole(roleName)),
      );
      return roles;
    } catch (error) {
      throw new Error('Role initialization failed: ' + error.message);
    }
  }

  async initializeRole(roleName) {
    try {
      const permissions = getRolePermissions(roleName);
      return await this.model
        .findOneAndUpdate(
          { name: roleName },
          { name: roleName, permissions },
          { upsert: true, new: true },
        )
        .exec();
    } catch (error) {
      throw new Error(
        `Failed to initialize role ${roleName}: ${error.message}`,
      );
    }
  }

  async createAdminUser() {
    const {
      DEFAULT_ADMIN_EMAIL,
      DEFAULT_ADMIN_PASSWORD,
      DEFAULT_ADMIN_USERNAME,
    } = process.env;

    if (
      !DEFAULT_ADMIN_EMAIL ||
      !DEFAULT_ADMIN_PASSWORD ||
      !DEFAULT_ADMIN_USERNAME
    ) {
      throw new Error(
        'Admin credentials not properly configured in environment',
      );
    }

    try {
      const adminRole = await this.model.findOne({ name: ROLES.ADMIN });
      if (!adminRole) throw new Error('Admin role not found');

      await UsersDBService.createUser({
        username: DEFAULT_ADMIN_USERNAME,
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD,
        roleName: ROLES.ADMIN,
      });
    } catch (error) {
      if (error.message.includes('User with this email already exists')) {
        console.log('Admin user already exists');
        return;
      }
      throw new Error(`Failed to create admin user: ${error.message}`);
    }
  }
}

export default new RolesDBService();
