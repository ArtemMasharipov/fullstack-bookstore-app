import baseApi from './baseApi';

export const fetchAuthors = async () => {
    const response = await baseApi.get('/authors');
    return response.data;
};

export const fetchAuthorDetails = async (authorId) => {
    const response = await baseApi.get(`/authors/${authorId}`);
    return response.data;
};

export const createAuthor = async (authorData) => {
    const response = await baseApi.post('/authors', authorData);
    return response.data;
};

export const updateAuthor = async (authorData) => {
    const response = await baseApi.put(`/authors/${authorData.id}`, authorData);
    return response.data;
};

export const deleteAuthor = async (authorId) => {
    const response = await baseApi.delete(`/authors/${authorId}`);
    return response.data;
};
