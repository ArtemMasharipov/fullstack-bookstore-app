import { authApi } from '@/api/authApi'
import { jwtDecode } from 'jwt-decode'
import { defineStore } from 'pinia'
import { useCartStore } from './cart'
import { handleAsyncAction } from './utils/stateHelpers'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    loading: false,
    error: null,
    permissions: []
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
    authToken: (state) => state.token,
    authLoading: (state) => state.loading,
    authError: (state) => state.error,
    hasPermission: (state) => (permission) => state.permissions.includes(permission),
  },
  
  actions: {
    async initialize() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
      }
    },
    
    async login(credentials) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await authApi.login(credentials);
        
        // Check if we have both user and token in the response
        if (!response || !response.user || !response.token) {
          throw new Error('Invalid login response from server');
        }
        
        const { user, token } = response;
        this.user = user;
        this.token = token;
        this.permissions = user.permissions || [];
        localStorage.setItem('token', token);
        
        // Синхронизация корзины после входа
        const cartStore = useCartStore();
        await cartStore.syncCart();
        
        return response;
      } catch (error) {
        console.error("Login error:", error.message);
        this.error = error.message || 'Login failed';
        this.user = null;
        this.token = null;
        this.permissions = [];
        localStorage.removeItem('token');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async register(userData) {
      return handleAsyncAction(this, async () => {
        const { user, token } = await authApi.register(userData);
        this.user = user;
        this.token = token;
        this.permissions = user.permissions || [];
        localStorage.setItem('token', token);
      });
    },
    
    async logout() {
      return handleAsyncAction(this, async () => {
        await authApi.logout();
        this.user = null;
        this.token = null;
        this.permissions = [];
        localStorage.removeItem('token');
      });
    },
    
    restoreUserFromToken() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          this.user = decoded;
          this.permissions = decoded.permissions || [];
        } catch (error) {
          console.error('Error decoding token:', error.message);
          this.user = null;
          this.permissions = [];
          localStorage.removeItem('token');
        }
      }
    }
  }
})