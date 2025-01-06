<template>
    <teleport to="body">
        <div class="modal-wrapper">
            <div class="modal-overlay" @click="$emit('close')"></div>
            <div class="modal-container" :class="size">
                <slot></slot>
            </div>
        </div>
    </teleport>
</template>

<script>
export default {
    name: 'BaseModal',
    props: {
        size: {
            type: String,
            default: 'medium',
            validator: (value) => ['small', 'medium', 'large'].includes(value)
        }
    },
    emits: ['close']
}
</script>

<style scoped>
.modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
}

.modal-container {
    position: relative;
    background: var(--white);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1001;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-container.small {
    width: 90%;
    max-width: 400px;
}

.modal-container.medium {
    width: 90%;
    max-width: 600px;
}

.modal-container.large {
    width: 90%;
    max-width: 800px;
}
</style>
