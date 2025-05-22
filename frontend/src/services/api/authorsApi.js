import { createApiClient } from './apiFactory'
import { apiRequest } from './baseApi'
export const authorsApi = createApiClient('authors', {
    fetchPopularAuthors: () => apiRequest('get', '/authors/popular'),
})
