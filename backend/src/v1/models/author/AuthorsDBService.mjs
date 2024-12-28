import MongooseCRUDManager from '../MongooseCRUDManager.mjs';
import Author from './authorModel.mjs';

class AuthorsDBService extends MongooseCRUDManager {
  constructor() {
    super(Author);
  }

  async getAuthorWithBooks(id) {
    try {
      return await this.model.findById(id).populate('books').exec();
    } catch (error) {
      throw new Error('Error fetching author with books: ' + error.message);
    }
  }
}

export default new AuthorsDBService();
