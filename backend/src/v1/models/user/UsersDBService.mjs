import User from './userModel.mjs';
import Role from '../role/roleModel.mjs';

class UsersDBService {
  async createUser({ username, email, password, roleName }) {
    try {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        throw new Error(`Role not found: ${roleName}`);
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = new User({ username, email, password, role: role._id });
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  findByEmail(email) {
    return User.findOne({ email }).populate('role');
  }

  async findById(id) {
    return User.findById(id).populate('role');
  }
}

export default new UsersDBService();
