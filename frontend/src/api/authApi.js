import { apiRequest } from './baseApi';

export const authApi = {
    login: async (credentials) => {
        try {
            const response = await apiRequest('post', '/auth/login', credentials);
            
            // Validate the response structure
            if (!response.user || !response.token) {
                throw new Error(response.error || 'Invalid response format from server');
            }
            
            // Store token in localStorage
            const { token } = response;
            if (token) localStorage.setItem('token', token);
            
            return response;
        } catch (error) {
            console.error('Login API error:', error);
            // Ensure we throw an error with a proper message
            throw new Error(error.message || 'Login failed. Please check your credentials.');
        }
    },
    
    register: async (userData) => {
        try {
            const response = await apiRequest('post', '/auth/register', userData);
            
            if (!response.user || !response.token) {
                throw new Error(response.error || 'Invalid registration response');
            }
            
            const { token } = response;
            if (token) localStorage.setItem('token', token);
            
            return response;
        } catch (error) {
            console.error('Registration API error:', error);
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    },
    
    logout: () => localStorage.removeItem('token'),
}
