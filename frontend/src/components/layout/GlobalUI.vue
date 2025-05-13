<template>
  <div>
    <!-- Note: This component is deprecated. 
         Toast notifications are now handled by the Toast component.
         Dialog functionality has moved to the DialogUI component. -->
    <div class="deprecated-component"></div>
  </div>
</template>

<script>
/**
 * DEPRECATED: Global UI component
 * 
 * This component is kept for backward compatibility but no longer contains functionality.
 * - Toast notifications are now handled by the Toast component
 * - Dialog functionality is now handled by the DialogUI component
 *
 * This component will be removed in a future release.
 */
export default {
  name: 'GlobalUI',
};
</script>

<style scoped>
.toast-notification {
  margin-top: 0px !important;
  margin-right: 16px !important;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
  border-radius: 4px !important;
  width: auto !important;
  min-width: 250px !important;
  max-width: 400px !important;
}
</style>
