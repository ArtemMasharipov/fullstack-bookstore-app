<template>
    <!-- The shape of a book card while the books load: the cards take its place without moving the page -->
    <div class="book-card-skeleton" aria-hidden="true">
        <div class="book-card-skeleton__block" style="aspect-ratio: 2 / 3"></div>
        <div class="book-card-skeleton__body">
            <span class="book-card-skeleton__block book-card-skeleton__line" style="width: 40%"></span>
            <span class="book-card-skeleton__block book-card-skeleton__title"></span>
            <span class="book-card-skeleton__block book-card-skeleton__line" style="width: 60%"></span>
            <span class="book-card-skeleton__block book-card-skeleton__meta"></span>
            <span class="book-card-skeleton__block book-card-skeleton__button"></span>
        </div>
    </div>
</template>

<style scoped>
.book-card-skeleton {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 8px;
    background: rgb(var(--v-theme-surface));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.book-card-skeleton__block {
    display: block;
    background: rgb(var(--v-theme-surface-variant));
    animation: book-card-skeleton-pulse 1.5s ease-in-out infinite;
}

/* The same spacing as the card's body */
.book-card-skeleton__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px 16px;
}

.book-card-skeleton__line {
    height: 14px;
    border-radius: 4px;
}

.book-card-skeleton__title {
    height: 46px;
    border-radius: 4px;
}

.book-card-skeleton__meta {
    height: 32px;
    border-radius: 4px;
}

.book-card-skeleton__button {
    height: 36px;
    border-radius: 8px;
}

@keyframes book-card-skeleton-pulse {
    50% {
        opacity: 0.5;
    }
}

@media (prefers-reduced-motion: reduce) {
    .book-card-skeleton__block {
        animation: none;
    }
}
</style>
