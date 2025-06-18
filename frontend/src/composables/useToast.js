import { useNotifications } from './useNotifications'

/**
 * Compatibility layer for code that might use useToast
 * Redirects to our new useNotifications composable
 */
export function useToast() {
    return useNotifications()
}
