<!-- Vue компонент с примерами использования toast-уведомлений -->
<template>
  <div class="toast-examples">
    <h2 class="mb-4">Toast Notification Examples</h2>
    
    <v-card class="mb-6">
      <v-card-title>Basic Usage</v-card-title>
      <v-card-text>
        <v-btn color="success" class="me-2" @click="showSuccessToast">
          Success
        </v-btn>
        <v-btn color="error" class="me-2" @click="showErrorToast">
          Error
        </v-btn>
        <v-btn color="warning" class="me-2" @click="showWarningToast">
          Warning
        </v-btn>
        <v-btn color="info" class="me-2" @click="showInfoToast">
          Info
        </v-btn>
      </v-card-text>
    </v-card>
    
    <v-card class="mb-6">
      <v-card-title>Advanced Usage</v-card-title>
      <v-card-text>
        <v-btn class="me-2 mb-2" @click="showCustomPositionToast">
          Custom Position
        </v-btn>
        <v-btn class="me-2 mb-2" @click="showLongDurationToast">
          Long Duration
        </v-btn>
        <v-btn class="me-2 mb-2" @click="showWithErrorObject">
          With Error Object
        </v-btn>
        <v-btn color="error" class="me-2 mb-2" @click="clearAllToasts">
          Clear All
        </v-btn>
      </v-card-text>
    </v-card>
    
    <v-card class="mb-6">
      <v-card-title>With Template Messages</v-card-title>
      <v-card-text>
        <v-btn class="me-2 mb-2" @click="showCreateSuccessTemplate">
          Create Success Template
        </v-btn>
        <v-btn class="me-2 mb-2" @click="showUpdateErrorTemplate">
          Update Error Template
        </v-btn>
        <v-btn class="me-2 mb-2" @click="showLoginSuccessTemplate">
          Login Success Template
        </v-btn>
      </v-card-text>
    </v-card>
    
    <v-card class="mb-6">
      <v-card-title>With Helper Functions</v-card-title>
      <v-card-text>
        <v-btn class="me-2 mb-2" @click="useCreateHelper">
          Create with Helper
        </v-btn>
        <v-btn class="me-2 mb-2" @click="useUpdateHelper">
          Update with Helper
        </v-btn>
        <v-btn class="me-2 mb-2" @click="useDeleteHelper">
          Delete with Helper
        </v-btn>
        <v-btn class="me-2 mb-2" @click="useLoadHelper">
          Load with Helper
        </v-btn>
      </v-card-text>
    </v-card>
    
    <v-card class="mb-6">
      <v-card-title>With withToast Function</v-card-title>
      <v-card-text>
        <v-btn class="me-2 mb-2" @click="useWithToastSuccess">
          With Toast Success
        </v-btn>
        <v-btn class="me-2 mb-2" @click="useWithToastError">
          With Toast Error
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { toast, toastHelpers } from '@/stores';

export default {
  name: 'ToastExamples',
  
  methods: {
    // Basic usage
    showSuccessToast() {
      toast.success('Operation completed successfully');
    },
    
    showErrorToast() {
      toast.error('Something went wrong');
    },
    
    showWarningToast() {
      toast.warning('Be careful with this action');
    },
    
    showInfoToast() {
      toast.info('Just FYI');
    },
    
    // Advanced usage
    showCustomPositionToast() {
      toast.success('Custom position toast', { position: 'top-center' });
    },
    
    showLongDurationToast() {
      toast.info('This will stay for 10 seconds', { duration: 10000 });
    },
    
    showWithErrorObject() {
      const error = new Error('Server responded with 500');
      toast.error('Failed to fetch data', error);
    },
    
    clearAllToasts() {
      toast.clear();
      toast.info('All toasts have been cleared');
    },
    
    // With template messages
    showCreateSuccessTemplate() {
      toast.success(toast.messages.crud.createSuccess('Book "War and Peace"'));
    },
    
    showUpdateErrorTemplate() {
      toast.error(toast.messages.crud.updateError('Author'));
    },
    
    showLoginSuccessTemplate() {
      toast.success(toast.messages.auth.loginSuccess('John Doe'));
    },
    
    // With helper functions
    async useCreateHelper() {
      try {
        await toastHelpers.handleCreate({
          entityName: 'Book',
          displayName: 'The Great Gatsby',
          operation: () => {
            // Simulate API call
            return new Promise(resolve => {
              setTimeout(() => {
                resolve({ id: '123', title: 'The Great Gatsby' });
              }, 1000);
            });
          }
        });
      } catch (error) {
        console.error('Error caught in component:', error);
      }
    },
    
    async useUpdateHelper() {
      try {
        await toastHelpers.handleUpdate({
          entityName: 'Author',
          displayName: 'J.K. Rowling',
          operation: () => {
            // Simulate API call
            return new Promise(resolve => {
              setTimeout(() => {
                resolve({ id: '456', name: 'J.K. Rowling' });
              }, 1000);
            });
          }
        });
      } catch (error) {
        console.error('Error caught in component:', error);
      }
    },
    
    async useDeleteHelper() {
      try {
        await toastHelpers.handleDelete({
          entityName: 'User',
          displayName: 'admin@example.com',
          operation: () => {
            // Simulate API call
            return new Promise(resolve => {
              setTimeout(() => {
                resolve({ success: true });
              }, 1000);
            });
          }
        });
      } catch (error) {
        console.error('Error caught in component:', error);
      }
    },
    
    async useLoadHelper() {
      try {
        await toastHelpers.handleLoad({
          entityName: 'Orders',
          operation: () => {
            // Simulate API call
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                // Simulate error
                if (Math.random() > 0.5) {
                  reject(new Error('Network error'));
                } else {
                  resolve([{ id: '1', total: 100 }, { id: '2', total: 200 }]);
                }
              }, 1000);
            });
          }
        });
      } catch (error) {
        console.error('Error caught in component:', error);
      }
    },
    
    // With withToast function
    async useWithToastSuccess() {
      try {
        await toast.withToast(
          () => {
            // Simulate API call
            return new Promise(resolve => {
              setTimeout(() => {
                resolve({ success: true });
              }, 1000);
            });
          },
          {
            success: 'Complex operation completed successfully',
            error: 'Failed to complete the complex operation'
          }
        );
      } catch (error) {
        console.error('Error caught in component:', error);
      }
    },
    
    async useWithToastError() {
      try {
        await toast.withToast(
          () => {
            // Simulate API call
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                reject(new Error('Service unavailable'));
              }, 1000);
            });
          },
          {
            success: 'This will never be shown',
            error: 'Failed to process your request'
          }
        );
      } catch (error) {
        console.error('Error caught in component:', error);
      }
    }
  }
};
</script>

<style scoped>
.toast-examples {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>
