# Toast Notification System Documentation

> **Note:** This documentation has been superseded by the enhanced notification system.
> Please refer to [ENHANCED_NOTIFICATION_SYSTEM.md](./ENHANCED_NOTIFICATION_SYSTEM.md) for the current implementation.

## Overview

The bookstore application uses the `vue-toast-notification` library to provide consistent user feedback across the entire application. This approach follows best practices of using established libraries rather than custom implementations, providing a professional and reliable notification system.

## Core Components

### 1. Toast Library

The application uses the `vue-toast-notification` library, a well-maintained Vue.js toast notification package.

```javascript
// In main.js
import ToastPlugin from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-bootstrap.css'

app.use(ToastPlugin, {
  position: 'top-right',
  duration: 5000,
  dismissible: true,
  pauseOnHover: true
})
```

### 2. Toast Service (`enhancedToast.js`)

A service wrapper around the library that provides a consistent and simplified API for showing notifications.

```javascript
// Import and use in components
import { toast } from '@/stores';

// Show different types of notifications
toast.success('Operation completed successfully');
toast.error('An error occurred');
toast.warning('Be careful with this action');
toast.info('Just FYI');
```

## Features

- Type-based notifications (success, error, warning, info)
- Customizable timeout durations
- Consistent positioning
- Pausable on hover
- Dismissible notifications

## Benefits

1. **Consistency**: All notifications have a consistent style and behavior
2. **Simplicity**: Show notifications with a single line of code
3. **Maintainability**: Leverages a tried and tested library
4. **Reduced Code**: No need to maintain custom notification components

## Example Usage

```javascript
// In a component or store
import { toast } from '@/stores';

export default {
  methods: {
    async saveData() {
      try {
        await this.apiCall();
        toast.success('Data saved successfully');
      } catch (error) {
        toast.error(`Failed to save: ${error.message}`);
      }
    }
  }
};
```

## Advanced Configuration

For cases where you need more control over the notifications:

```javascript
toast.success('Operation completed', {
  duration: 3000,        // Custom duration in ms
  position: 'bottom',    // Custom position
  dismissible: false     // Disable manual dismissal
});
```

## Best Practices

1. **Use Semantic Types**: Choose the appropriate notification type (success, error, warning, info) based on the message content
2. **Keep Messages Short**: Toast notifications should be brief and to the point
3. **Error Context**: Include relevant error information but keep it concise
4. **Avoid Overuse**: Only show notifications for important events that require user attention
