import MongooseCRUDManager from '../MongooseCRUDManager.mjs';
import Book from './bookModel.mjs';

class BooksDBService extends MongooseCRUDManager {
  constructor() {
    super(Book);
  }
}

export default new BooksDBService();
