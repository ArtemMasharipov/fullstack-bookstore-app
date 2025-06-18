/**
 * Utility functions for testing notification system
 * These functions can be called from browser console or integrated into tests
 */

import { useNotifications } from '@/composables/useNotifications'

// Get the notification system
const notifications = useNotifications()

/**
 * Test basic notification types
 */
export function testBasicNotifications() {
    console.log('🧪 Testing basic notifications...')

    setTimeout(() => {
        notifications.success('✅ Success notification test')
    }, 500)

    setTimeout(() => {
        notifications.info('ℹ️ Info notification test')
    }, 1000)

    setTimeout(() => {
        notifications.warning('⚠️ Warning notification test')
    }, 1500)

    setTimeout(() => {
        notifications.error('❌ Error notification test')
    }, 2000)

    console.log('✅ Basic notifications test initiated')
}

/**
 * Test notification actions
 */
export function testNotificationActions() {
    console.log('🧪 Testing notification actions...')

    notifications.show({
        message: '📧 You have a new message',
        type: 'info',
        persistent: true,
        actions: [
            {
                label: 'View',
                color: 'primary',
                handler: () => {
                    console.log('View action clicked!')
                    notifications.success('Message viewed')
                },
            },
            {
                label: 'Dismiss',
                color: 'grey',
                handler: () => {
                    console.log('Dismiss action clicked!')
                },
            },
        ],
    })

    console.log('✅ Notification with actions created')
}

/**
 * Test HTML notifications
 */
export function testHtmlNotifications() {
    console.log('🧪 Testing HTML notifications...')

    notifications.show({
        message: '<strong>Bold text</strong> and <em>italic text</em><br/>New line here',
        type: 'info',
        html: true,
        timeout: 6000,
    })

    console.log('✅ HTML notification created')
}

/**
 * Test notification grouping
 */
export function testNotificationGrouping() {
    console.log('🧪 Testing notification grouping...')

    // First notification in group
    notifications.show({
        message: '📊 Data sync started',
        type: 'info',
        group: 'sync',
        persistent: true,
    })

    setTimeout(() => {
        // This should replace the previous one
        notifications.show({
            message: '📊 Data sync in progress... 50%',
            type: 'warning',
            group: 'sync',
            persistent: true,
        })
    }, 2000)

    setTimeout(() => {
        // This should replace the previous one
        notifications.show({
            message: '📊 Data sync completed!',
            type: 'success',
            group: 'sync',
            timeout: 4000,
        })
    }, 4000)

    console.log('✅ Grouped notifications test initiated')
}

/**
 * Test notification queuing
 */
export function testNotificationQueuing() {
    console.log('🧪 Testing notification queuing...')

    // Create 8 notifications quickly to test the queue system
    for (let i = 1; i <= 8; i++) {
        notifications.show({
            message: `📋 Queued notification #${i}`,
            type: i % 2 === 0 ? 'success' : 'info',
            timeout: 3000,
        })
    }

    console.log('✅ Queue test initiated - created 8 notifications')
}

/**
 * Test sound system
 */
export function testSoundSystem() {
    console.log('🧪 Testing sound system...')

    const types = ['success', 'error', 'warning', 'info']

    types.forEach((type, index) => {
        setTimeout(() => {
            notifications.show({
                message: `🔊 Sound test for ${type}`,
                type,
                timeout: 2000,
                sound: true,
            })
        }, index * 1000)
    })

    console.log('✅ Sound test initiated')
}

/**
 * Test persistence
 */
export function testPersistentNotifications() {
    console.log('🧪 Testing persistent notifications...')

    notifications.show({
        message: "📌 This notification is persistent and won't auto-hide",
        type: 'warning',
        persistent: true,
    })

    notifications.show({
        message: '⏰ This notification will auto-hide in 3 seconds',
        type: 'info',
        timeout: 3000,
    })

    console.log('✅ Persistent notifications test initiated')
}

/**
 * Run all tests sequentially
 */
export function runAllTests() {
    console.log('🚀 Running comprehensive notification system tests...')

    testBasicNotifications()

    setTimeout(() => testNotificationActions(), 3000)
    setTimeout(() => testHtmlNotifications(), 6000)
    setTimeout(() => testNotificationGrouping(), 9000)
    setTimeout(() => testPersistentNotifications(), 15000)
    setTimeout(() => testSoundSystem(), 18000)
    setTimeout(() => testNotificationQueuing(), 25000)

    console.log('⏳ All tests scheduled. Check the UI and console for results.')
}

/**
 * Clear all notifications
 */
export function clearAll() {
    notifications.clear()
    console.log('🧹 All notifications cleared')
}

/**
 * Toggle sound
 */
export function toggleSound() {
    const enabled = notifications.toggleSound()
    console.log(`🔊 Sound ${enabled ? 'enabled' : 'disabled'}`)
    return enabled
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
    window.testNotifications = {
        testBasicNotifications,
        testNotificationActions,
        testHtmlNotifications,
        testNotificationGrouping,
        testNotificationQueuing,
        testSoundSystem,
        testPersistentNotifications,
        runAllTests,
        clearAll,
        toggleSound,
    }

    console.log('🔧 Notification test utilities available at window.testNotifications')
    console.log('Usage: testNotifications.runAllTests()')
}
