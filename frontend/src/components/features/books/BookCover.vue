<template>
    <!-- The box keeps its 2:3 shape before the image or the stylesheet loads, so nothing below it moves -->
    <div class="book-cover" style="aspect-ratio: 2 / 3">
        <img
            v-if="src && !failed"
            :src="src"
            alt=""
            decoding="async"
            :loading="eager || priority ? 'eager' : 'lazy'"
            :fetchpriority="priority ? 'high' : undefined"
            class="book-cover__image"
            @error="failed = true"
        />
        <!-- The title is next to the cover on every page, so the placeholder is not read out again -->
        <div v-else class="book-cover__placeholder" aria-hidden="true">
            <span class="book-cover__title">{{ title }}</span>
            <span v-if="author" class="book-cover__author">{{ author }}</span>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'

/**
 * A book cover in a 2:3 box: the image when there is one, otherwise a typographic placeholder with the title and the
 * author. The image is decorative (alt=""): the book's title is always next to it.
 */
const props = defineProps({
    src: {
        type: String,
        default: '',
    },
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        default: '',
    },
    // Loads at once: covers in the first screen
    eager: Boolean,
    // Loads at once with high priority: the largest image of the page
    priority: Boolean,
})

const failed = ref(false)

// A new image gets its own chance to load
watch(
    () => props.src,
    () => {
        failed.value = false
    }
)
</script>

<style scoped>
.book-cover {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 3px;
    background: rgb(var(--v-theme-surface-variant));
}

.book-cover__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.book-cover__placeholder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    height: 100%;
    padding: 16px;
    color: rgb(var(--v-theme-on-surface));
    text-align: center;
}

.book-cover__title {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: anywhere;
}

.book-cover__author {
    font-size: 0.875rem;
    line-height: 1.45;
}
</style>
