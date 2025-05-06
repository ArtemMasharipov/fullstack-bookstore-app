/**
 * Composable for handling authentication logic
 * Provides reactive authentication state and methods
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAuthStore, useAuthUiStore } from '@/store';
import { useToast } from './useToast';

export function useAuth() {
  // Router
  const router = useRouter();
  
  // Stores
  const authStore = useAuthStore();
  const authUiStore = useAuthUiStore();
  
  // Extract reactive state
  const { user, token, loading, error } = storeToRefs(authStore);
  const { redirectPath } = storeToRefs(authUiStore);
  
  // Composables
  const toast = useToast();
  
  // Computed properties
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isAdmin = computed(() => authStore.isAdmin);
  const currentUser = computed(() => authStore.currentUser);
  const hasPermission = computed(() => (permission) => authStore.hasPermission(permission));
  
  // Authentication methods
  async function login(credentials) {
    try {
      const success = await authUiStore.handleLogin(credentials);
      if (success) {
        toast.success('Login successful!');
        
        // Redirect to intended page or home
        const targetPath = redirectPath.value || '/';
        authUiStore.setRedirectPath('/'); // Reset redirect path
        await router.push(targetPath);
      }
      return success;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  }
  
  async function register(userData) {
    try {
      const success = await authUiStore.handleRegister(userData);
      if (success) {
        toast.success('Registration successful!');
        await router.push('/');
      }
      return success;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  }
  
  async function logout() {
    try {
      await authUiStore.handleLogout();
      toast.success('Logged out successfully');
      await router.push('/login');
    } catch (error) {
      toast.error('Logout failed');
      throw error;
    }
  }
  
  async function refreshToken() {
    try {
      return await authStore.refreshToken();
    } catch (error) {
      // Token refresh failed, redirect to login
      await logout();
      throw error;
    }
  }
  
  // User profile methods
  async function updateProfile(profileData) {
    try {
      await authStore.updateProfile(profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  }
  
  async function changePassword(passwordData) {
    try {
      await authStore.changePassword(passwordData);
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error('Failed to change password');
      throw error;
    }
  }
  
  // Initialize authentication on app start
  async function initialize() {
    try {
      await authStore.initialize();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }
  
  // Check if user has specific permission
  function checkPermission(permission) {
    return hasPermission.value(permission);
  }
  
  // Set redirect path for after login
  function setRedirectPath(path) {
    authUiStore.setRedirectPath(path);
  }
  
  return {
    // State
    user,
    token,
    loading,
    error,
    redirectPath,
    
    // Computed
    isAuthenticated,
    isAdmin,
    currentUser,
    hasPermission,
    
    // Methods
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    initialize,
    checkPermission,
    setRedirectPath,
    
    // Store methods
    clearError: authStore.clearError,
    clearAuthError: authUiStore.clearError
  };
}
