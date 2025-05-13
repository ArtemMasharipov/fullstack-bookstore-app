<template>
  <div>
    <!-- Global Dialog System -->
    <v-dialog
      v-model="dialogVisible"
      :max-width="getDialogWidth"
      persistent
      @click:outside="closeOnClickOutside"
    >
      <component 
        :is="dynamicComponent" 
        v-if="dialogVisible && dialogType"
        v-bind="dialogData"
        @close="closeDialog"
      />
    </v-dialog>
  </div>
</template>

<script>
import { useUiStore } from '@/stores';
import { mapActions, mapGetters } from 'pinia';

/**
 * GlobalUI component for handling app-level UI elements like dialogs
 * Note: Toast notifications are now handled by the Toast component
 */
export default {
  name: 'GlobalUI',
  computed: {
    ...mapGetters(useUiStore, [
      'dialogVisible',
      'dialogType',
      'dialogData'
    ]),
    
    /**
     * Dynamically load dialog components based on the dialog type
     */
    dynamicComponent() {
      if (!this.dialogType) return null;
      
      // Map dialog types to components - can be expanded as needed
      const componentMap = {
        'confirm': () => import('@/components/common/ConfirmModal.vue'),
        // Add more mappings as needed
      };
      
      // Return the component or a fallback
      return componentMap[this.dialogType] || null;
    },
    
    /**
     * Get appropriate width for different dialog types
     */
    getDialogWidth() {
      const widthMap = {
        'confirm': '400px',
      };
      
      return widthMap[this.dialogType] || '500px';
    }
  },
  
  methods: {
    ...mapActions(useUiStore, ['closeDialog']),
    
    /**
     * Handle outside clicks - dialog will close only if it's not marked as persistent
     */
    closeOnClickOutside() {
      // Dialog data can specify if clicking outside should close the dialog
      if (this.dialogData && this.dialogData.persistent === false) {
        this.closeDialog();
      }
    }
  }
};
</script>
