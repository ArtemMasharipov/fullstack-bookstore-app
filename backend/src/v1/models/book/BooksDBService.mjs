import Book from './bookModel.mjs';

class BooksDBService {
  async createBook(data) {
    const book = new Book(data);
    return book.save();
  }

  async getBooks() {
    return Book.find();
  }

  async getBookById(id) {
    return Book.findById(id);
  }

  async updateBook(id, data) {
    return Book.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteBook(id) {
    return Book.findByIdAndDelete(id);
  }
}

export default new BooksDBService();
