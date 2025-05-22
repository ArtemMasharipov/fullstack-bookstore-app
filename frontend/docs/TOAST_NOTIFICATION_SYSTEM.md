# Toast Notification System Documentation

## Overview

The application uses a multi-layered toast notification system to provide consistent feedback to users across different operations. This document explains the current architecture of the toast notification system.

## Components

The toast notification system consists of the following components:

### 1. `enhancedToast.js`

Located in `src/services/enhancedToast.js`, this is the core toast service that provides:

- Type-based configurations (success, error, warning, info)
- Message templates for common operations
- Helper functions for CRUD operations
- Consistent styling and behavior

This service is exported from `src/stores/index.js` as `toast` for application-wide use.

### 2. `toastHelpers.js`

Located in `src/services/toastHelpers.js`, this provides higher-level abstractions for common toast use cases:

- CRUD operation helpers with consistent messaging
- Error handling patterns
- Success confirmation patterns

### 3. `toastSync.js`

Located in `src/utils/toastSync.js`, this is a utility added to solve synchronization issues with toast notifications:

- Ensures toast notifications appear properly during navigation
- Prevents race conditions in asynchronous operations
- Provides reliable toast display for cart operations

## Usage Patterns

### Basic Usage

```javascript
import { toast } from '@/store';

// Show a success message
toast.success('Operation completed successfully');

// Show an error message
toast.error('An error occurred', { duration: 8000 });
```

### Using Toast Sync Utilities

```javascript
import { syncSuccess, syncError } from '@/utils/toastSync';

// Show a synchronized success message
syncSuccess('Item added to cart');

// Show a synchronized error message
syncError('Failed to add item to cart');
```

### Using Toast Helpers for CRUD Operations

```javascript
import { toastHelpers } from '@/store';

// Handle a create operation with appropriate toast notifications
await toastHelpers.handleCreate({
  entityName: 'User',
  displayName: user.name,
  operation: async () => await api.createUser(userData),
  onSuccess: () => router.push('/users')
});
```

## Best Practices

1. Use `syncSuccess`, `syncError` and `syncInfo` from `toastSync.js` for operations that change routes or update state
2. Use toast helpers for CRUD operations to ensure consistent messaging
3. Centralize toast configuration in the enhanced toast service
4. Use appropriate toast types for different message categories

## Future Improvements

Potential improvements to the toast notification system:

1. Standardize all toast usage to use the synchronized utilities
2. Add support for toast actions (buttons within toast messages)
3. Implement toast grouping for similar messages
4. Add support for progress indicators in toasts for long-running operations
