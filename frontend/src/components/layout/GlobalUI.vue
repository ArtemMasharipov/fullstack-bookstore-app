<template>
  <div>
    <!-- Global Snackbars -->
    <v-snackbar
      v-model="snackbarVisible"
      :color="snackbarColor"
      :timeout="snackbarTimeout"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="closeSnackbar"
        ></v-btn>
      </template>
    </v-snackbar>

    <!-- Global Error Display -->
    <v-snackbar
      v-model="errorVisible"
      color="error"
      timeout="5000"
    >
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="clearError"
        ></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { useUiStore } from '@/stores';
import { mapActions, mapGetters } from 'pinia';

/**
 * Global UI component for handling app-level UI feedback (snackbars, alerts, etc.)
 * This component is always present in the app layout
 */
export default {
  name: 'GlobalUI',
  computed: {
    ...mapGetters(useUiStore, {
      snackbarVisible: 'snackbarVisible',
      snackbarMessage: 'snackbarMessage',
      snackbarColor: 'snackbarColor',
      snackbarTimeout: 'snackbarTimeout',
      errorVisible: 'errorVisible',
      errorMessage: 'errorMessage'
    })
  },
  methods: {
    ...mapActions(useUiStore, ['closeSnackbar', 'clearError'])
  }
};
</script>
