import baseApi from './baseApi';

export const fetchBooks = async () => {
    const response = await baseApi.get('/books');
    return response.data;
};

export const fetchBookDetails = async (bookId) => {
    const response = await baseApi.get(`/books/${bookId}`);
    return response.data;
};

export const createBook = async (bookData) => {
    const response = await baseApi.post('/books', bookData);
    return response.data;
};

export const updateBook = async (bookData) => {
    const response = await baseApi.put(`/books/${bookData.id}`, bookData);
    return response.data;
};

export const deleteBook = async (bookId) => {
    const response = await baseApi.delete(`/books/${bookId}`);
    return response.data;
};
