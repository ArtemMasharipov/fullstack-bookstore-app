<template>
  <div class="notification-container">
    <div class="notification-controls">
      <v-btn
        icon
        size="small"
        variant="text"
        @click="toggleSound"
        :color="soundEnabled ? 'primary' : 'grey'"
        :title="soundEnabled ? 'Отключить звук уведомлений' : 'Включить звук уведомлений'"
      >
        <v-icon :icon="soundEnabled ? 'mdi-volume-high' : 'mdi-volume-off'" />
      </v-btn>
      <v-btn
        icon
        size="small"
        variant="text"
        @click="soundSettingsDialog = true"
        color="primary"
        title="Настройки звука"
      >
        <v-icon icon="mdi-cog-outline" />
      </v-btn>
      <v-btn
        v-if="notifications.length > 0"
        icon
        size="small"
        variant="text"
        color="grey"
        title="Очистить все уведомления"
        @click="clear"
      >
        <v-icon icon="mdi-close-circle" />
      </v-btn>
    </div>

    <!-- Sound Settings Dialog -->
    <v-dialog v-model="soundSettingsDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Настройки звуковых уведомлений</v-card-title>
        <v-card-text>
          <v-switch
            v-model="soundEnabledLocal"
            color="primary"
            label="Звуковые уведомления"
            hide-details
            class="mb-4"
            @change="updateSoundSetting"
          ></v-switch>

          <p class="text-body-2 text-grey mb-2">Тестовые звуки:</p>
          <div class="d-flex flex-wrap gap-2">
            <v-btn
              size="small"
              color="success"
              variant="outlined"
              prepend-icon="mdi-check-circle"
              @click="testSound('success')"
              :disabled="!soundEnabledLocal"
            >
              Успех
            </v-btn>
            <v-btn
              size="small"
              color="error"
              variant="outlined"
              prepend-icon="mdi-alert-circle"
              @click="testSound('error')"
              :disabled="!soundEnabledLocal"
            >
              Ошибка
            </v-btn>
            <v-btn
              size="small"
              color="warning"
              variant="outlined"
              prepend-icon="mdi-alert"
              @click="testSound('warning')"
              :disabled="!soundEnabledLocal"
            >
              Предупреждение
            </v-btn>
            <v-btn
              size="small"
              color="info"
              variant="outlined"
              prepend-icon="mdi-information"
              @click="testSound('info')"
              :disabled="!soundEnabledLocal"
            >
              Информация
            </v-btn>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="soundSettingsDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <transition-group name="notification-slide" tag="div">
      <v-snackbar
        v-for="notification in notifications"
        :key="notification.id"
        v-model="notification.show"
        :color="getColor(notification.type)"
        :timeout="-1"
        location="top right"
        :multi-line="isMultiLine(notification.message)"
        :vertical="notification.actions?.length > 0"
        class="notification-snackbar"
        @update:model-value="(value) => !value && hide(notification.id)"
      >
        <div class="d-flex align-center">
          <v-icon :icon="getIcon(notification.type)" class="me-2" size="20" />
          <span class="notification-message" v-if="!notification.html">
            {{ notification.message }}
          </span>
          <span class="notification-message" v-else v-html="notification.message"></span>
        </div>

        <template v-if="notification.actions?.length > 0" #action>
          <v-btn
            v-for="action in notification.actions"
            :key="action.label"
            :color="action.color || 'white'"
            variant="text"
            size="small"
            @click="() => handleAction(action, notification)"
          >
            {{ action.label }}
          </v-btn>
        </template>

        <template v-else #action>
          <v-btn color="white" variant="text" size="small" icon="mdi-close" @click="hide(notification.id)" />
        </template>
      </v-snackbar>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotifications } from '@/composables/useNotifications'
import { playNotificationSound } from '@/utils/soundUtils'
import { ref } from 'vue'

const { notifications, hide, clear, toggleSound, getSoundEnabled } = useNotifications()
const soundEnabled = getSoundEnabled()
const soundEnabledLocal = ref(getSoundEnabled())
const soundSettingsDialog = ref(false)

/**
 * Update sound settings and persist to localStorage
 */
const updateSoundSetting = () => {
  toggleSound()
  soundEnabledLocal.value = getSoundEnabled()
}

/**
 * Test notification sound
 */
const testSound = (type) => {
  playNotificationSound(type, soundEnabledLocal.value)
}

/**
 * Get color based on notification type
 */
const getColor = (type) => {
  const colors = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  return colors[type] || 'info'
}

/**
 * Get icon based on notification type
 */
const getIcon = (type) => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information'
  }
  return icons[type] || 'mdi-information'
}

/**
 * Check if message requires multi-line display
 */
const isMultiLine = (message) => {
  return message.length > 60 || message.includes('\n')
}

/**
 * Handle action button click
 */
const handleAction = (action, notification) => {
  // Execute the action handler
  if (typeof action.handler === 'function') {
    action.handler()
  }

  // Close notification after action unless explicitly kept open
  if (!action.keepOpen) {
    hide(notification.id)
  }
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  pointer-events: none;
  max-width: 100%;
}

.notification-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
  pointer-events: auto;
}

.notification-snackbar {
  pointer-events: auto;
  margin-bottom: 8px;
  max-width: 400px;
  border-radius: 8px;
}

.gap-2 {
  gap: 8px;
}

@media (max-width: 600px) {
  .notification-container {
    top: 8px;
    right: 8px;
    left: 8px;
  }

  .notification-snackbar {
    max-width: 100%;
  }
}

:deep(.v-snackbar__wrapper) {
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-message {
  word-break: break-word;
}

/* Notification slide animation */
.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-slide-move {
  transition: transform 0.3s ease;
}
</style>
