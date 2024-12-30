import User from './userModel.mjs';
import Role from '../role/roleModel.mjs';
import MongooseCRUDManager from '../MongooseCRUDManager.mjs';
import bcrypt from 'bcrypt';

class UsersDBService extends MongooseCRUDManager {
  constructor() {
    super(User);
  }

  async createUser({ username, email, password, roleName }) {
    try {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        throw new Error(`Role not found: ${roleName}`);
      }

      const existingUser = await this.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new this.model({
        username,
        email,
        password: hashedPassword,
        role: role._id,
      });
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async findByEmail(email) {
    return this.findOne({ email }, null, ['role']);
  }

  async getUserCart(userId) {
    try {
      const user = await this.getById(userId, ['cart.book']);
      return user.cart;
    } catch (error) {
      throw new Error(`Error fetching user cart: ${error.message}`);
    }
  }

  async addToCart(userId, bookId, quantity) {
    try {
      const user = await this.getById(userId);
      const cartItem = user.cart.find((item) => item.book.equals(bookId));
      if (cartItem) {
        cartItem.quantity += quantity;
      } else {
        user.cart.push({ book: bookId, quantity });
      }
      await user.save();
      return user.cart;
    } catch (error) {
      throw new Error(`Error adding to cart: ${error.message}`);
    }
  }

  async removeFromCart(userId, bookId) {
    try {
      const user = await this.getById(userId);
      user.cart = user.cart.filter((item) => !item.book.equals(bookId));
      await user.save();
      return user.cart;
    } catch (error) {
      throw new Error(`Error removing from cart: ${error.message}`);
    }
  }

  async syncCart(userId, newCart) {
    try {
      const user = await this.getById(userId);
      user.cart = newCart;
      await user.save();
      return user.cart;
    } catch (error) {
      throw new Error(`Error syncing cart: ${error.message}`);
    }
  }
}

export default new UsersDBService();
