/**
 * Universal pagination composable
 * Provides reactive pagination state and methods for any dataset
 */
import { computed, ref, watch } from 'vue'

export function usePagination(items, itemsPerPage = 10) {
    // Reactive state
    const currentPage = ref(1)
    const perPage = ref(itemsPerPage)

    // Computed properties
    const totalItems = computed(() => items.value?.length || 0)
    const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value))

    const startIndex = computed(() => (currentPage.value - 1) * perPage.value)
    const endIndex = computed(() => startIndex.value + perPage.value)

    const paginatedItems = computed(() => {
        if (!items.value) return []
        return items.value.slice(startIndex.value, endIndex.value)
    })

    const hasNext = computed(() => currentPage.value < totalPages.value)
    const hasPrev = computed(() => currentPage.value > 1)

    const pageInfo = computed(() => ({
        current: currentPage.value,
        total: totalPages.value,
        perPage: perPage.value,
        totalItems: totalItems.value,
        startIndex: startIndex.value + 1, // Human-readable (1-based)
        endIndex: Math.min(endIndex.value, totalItems.value),
        hasNext: hasNext.value,
        hasPrev: hasPrev.value,
    }))

    // Generate page numbers for pagination controls
    const visiblePages = computed(() => {
        const delta = 2 // Number of pages to show on each side of current page
        const range = []
        const rangeWithDots = []

        for (
            let i = Math.max(2, currentPage.value - delta);
            i <= Math.min(totalPages.value - 1, currentPage.value + delta);
            i++
        ) {
            range.push(i)
        }

        if (currentPage.value - delta > 2) {
            rangeWithDots.push(1, '...')
        } else {
            rangeWithDots.push(1)
        }

        rangeWithDots.push(...range)

        if (currentPage.value + delta < totalPages.value - 1) {
            rangeWithDots.push('...', totalPages.value)
        } else if (totalPages.value > 1) {
            rangeWithDots.push(totalPages.value)
        }

        return rangeWithDots
    })

    // Methods
    function goToPage(page) {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page
        }
    }

    function nextPage() {
        if (hasNext.value) {
            currentPage.value++
        }
    }

    function prevPage() {
        if (hasPrev.value) {
            currentPage.value--
        }
    }

    function firstPage() {
        currentPage.value = 1
    }

    function lastPage() {
        currentPage.value = totalPages.value
    }

    function setItemsPerPage(newPerPage) {
        perPage.value = newPerPage
        // Adjust current page if necessary
        if (currentPage.value > totalPages.value) {
            currentPage.value = Math.max(1, totalPages.value)
        }
    }

    function reset() {
        currentPage.value = 1
    }

    // Watch for items changes and reset to first page if current page becomes invalid
    watch([totalPages], ([newTotalPages]) => {
        if (currentPage.value > newTotalPages && newTotalPages > 0) {
            currentPage.value = newTotalPages
        } else if (newTotalPages === 0) {
            currentPage.value = 1
        }
    })

    return {
        // State
        currentPage,
        perPage,

        // Computed
        totalItems,
        totalPages,
        paginatedItems,
        pageInfo,
        visiblePages,
        hasNext,
        hasPrev,

        // Methods
        goToPage,
        nextPage,
        prevPage,
        firstPage,
        lastPage,
        setItemsPerPage,
        reset,
    }
}
