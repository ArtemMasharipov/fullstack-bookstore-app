<template>
    <div 
        class="d-flex justify-center align-center" 
        :class="wrapperClasses"
        :style="{ minHeight: minHeight }"
    >
        <v-progress-circular
            indeterminate
            :color="color"
            :size="size"
        ></v-progress-circular>
    </div>
</template>

<script>
export default {
    name: 'LoadingSpinner',
    props: {
        /**
         * Color of the spinner (from Vuetify color palette)
         */
        color: {
            type: String,
            default: 'primary'
        },
        /**
         * Size of the spinner in pixels
         */
        size: {
            type: [Number, String],
            default: 50
        },
        /**
         * Minimum height of the container
         */
        minHeight: {
            type: String,
            default: '200px'
        },
        /**
         * Additional classes for the wrapper container
         */
        wrapperClasses: {
            type: [String, Array, Object],
            default: ''
        }
    }
}
</script>

<style scoped>
</style>