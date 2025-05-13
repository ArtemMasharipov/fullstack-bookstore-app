<template>
  <div class="notification-demo">
    <h2>Notifications Demo</h2>
    <div class="controls">
      <v-btn color="success" @click="showSuccessNotification">
        Show Success
      </v-btn>
      <v-btn color="error" @click="showErrorNotification">
        Show Error
      </v-btn>
      <v-btn color="warning" @click="showWarningNotification">
        Show Warning
      </v-btn>
      <v-btn color="info" @click="showInfoNotification">
        Show Info
      </v-btn>
    </div>
  </div>
</template>

<script>
import { toast } from '@/stores';

export default {
  name: 'NotificationsDemo',
  
  setup() {
    function showSuccessNotification() {
      toast.success('This is a success notification!');
    }
    
    function showErrorNotification() {
      toast.error('This is an error notification!');
    }
    
    function showWarningNotification() {
      toast.warning('This is a warning notification!');
    }
    
    function showInfoNotification() {
      toast.info('This is an info notification!');
    }
    
    return {
      showSuccessNotification,
      showErrorNotification,
      showWarningNotification,
      showInfoNotification
    };
  }
}
</script>

<style scoped>
.notification-demo {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
</style>
