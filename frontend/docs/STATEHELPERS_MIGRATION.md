# State Helpers Migration for Pinia

## Overview

As part of the migration from Vuex to Pinia, we've updated the `handleAsyncAction` helper function to work with Pinia's direct mutation approach instead of Vuex's commit pattern.

## Changes Made

### Before (Vuex pattern)

The previous implementation expected a `commit` function as its first parameter, following the Vuex pattern:

```javascript
export const handleAsyncAction = async (commit, action, options = {}) => {
    // ...
    !skipLoading && commit(loadingMutation, true)
    
    try {
        // ...
    } catch (error) {
        commit(errorMutation, errorMessage)
        // ...
    } finally {
        !skipLoading && commit(loadingMutation, false)
    }
}
```

### After (Pinia pattern)

The new implementation expects a store instance as its first parameter, and directly calls the mutation methods on it:

```javascript
export const handleAsyncAction = async (store, action, options = {}) => {
    // ...
    !skipLoading && store[loadingMutation](true)
    
    try {
        // ...
    } catch (error) {
        store[errorMutation](errorMessage)
        // ...
    } finally {
        !skipLoading && store[loadingMutation](false)
    }
}
```

## Usage Example

```javascript
// In a Pinia store action
async fetchItems() {
    return handleAsyncAction(this, async () => {
        const items = await api.fetchItems()
        this.setItems(items)
        return items
    })
}
```

## Benefits

1. **Consistent with Pinia**: Aligns with Pinia's more direct approach to state management
2. **Type Safety**: Better TypeScript integration with direct method calls
3. **Simplicity**: No need to understand Vuex's commit vs dispatch pattern

## Important Notes

- The function signature has changed from `(commit, action, options)` to `(store, action, options)`
- The store instance must have methods matching the names in `loadingMutation` and `errorMutation` (default: 'setLoading' and 'setError')
- This change maintains backward compatibility with our existing code structure while adapting to Pinia's patterns
