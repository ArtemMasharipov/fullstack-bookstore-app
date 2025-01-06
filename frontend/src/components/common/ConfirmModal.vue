<template>
    <div class="modal-overlay" @click.self="$emit('cancel')">
        <div class="modal-content">
            <h3 class="modal-title">{{ title }}</h3>
            <p class="modal-message">{{ message }}</p>
            <div class="modal-actions">
                <button 
                    class="btn btn-secondary" 
                    @click="$emit('cancel')"
                >
                    {{ cancelText }}
                </button>
                <button 
                    class="btn btn-danger" 
                    @click="$emit('confirm')"
                >
                    {{ confirmText }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ConfirmModal',
    props: {
        title: {
            type: String,
            default: 'Confirm Action'
        },
        message: {
            type: String,
            required: true
        },
        confirmText: {
            type: String,
            default: 'Confirm'
        },
        cancelText: {
            type: String,
            default: 'Cancel'
        }
    },
    emits: ['confirm', 'cancel']
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
}

.modal-title {
    margin: 0 0 1rem;
    color: var(--text-primary);
}

.modal-message {
    margin-bottom: 1.5rem;
    color: var(--text-secondary);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.btn-secondary {
    background-color: var(--gray-medium);
    color: white;
}

.btn-danger {
    background-color: var(--danger-color, #dc3545);
    color: white;
}
</style>
