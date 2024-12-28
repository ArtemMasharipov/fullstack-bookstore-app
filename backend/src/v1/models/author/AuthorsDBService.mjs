import Author from './authorModel.mjs';

class AuthorsDBService {
  async createAuthor(data) {
    const author = new Author(data);
    return author.save();
  }

  async getAuthors() {
    return Author.find();
  }

  async getAuthorById(id) {
    return Author.findById(id);
  }

  async getAuthorWithBooks(id) {
    return Author.findById(id).populate('books');
  }

  async updateAuthor(id, data) {
    return Author.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteAuthor(id) {
    return Author.findByIdAndDelete(id);
  }
}

export default new AuthorsDBService();
