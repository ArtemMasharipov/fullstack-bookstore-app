/**
 * Sound files for notification system
 * These MP3 files should be added to the public/sounds directory
 */
export const NOTIFICATION_SOUNDS = {
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    warning: '/sounds/warning.mp3',
    info: '/sounds/info.mp3',
}

/**
 * Play notification sound
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {boolean} enabled - Whether sound is enabled
 */
export function playNotificationSound(type, enabled = true) {
    if (!enabled) return

    const soundUrl = NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.info
    const audio = new Audio(soundUrl)

    try {
        audio.volume = 0.5 // 50% volume
        audio.play().catch((error) => {
            // Ignore play() errors - they occur when user hasn't interacted with the page yet
            console.debug('Notification sound could not play:', error.message)
        })
    } catch (error) {
        console.debug('Notification sound error:', error)
    }
}

/**
 * Check if sound is supported
 */
export function isSoundSupported() {
    return typeof Audio !== 'undefined'
}
