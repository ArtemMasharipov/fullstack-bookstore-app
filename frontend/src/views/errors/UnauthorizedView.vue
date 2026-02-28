<template>
    <div class="error-view">
        <div class="error-container">
            <div class="error-icon">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93C9.33 17.79 7 14.5 7 11V7.18L12 5zm-1 3v4h2V8h-2zm0 6v2h2v-2h-2z"
                    />
                </svg>
            </div>

            <h1 class="error-title">403</h1>
            <h2 class="error-subtitle">Access Denied</h2>

            <p class="error-message">You do not have permission to view this page.</p>

            <div class="error-actions">
                <router-link :to="{ name: 'Home' }" class="btn btn-primary">Go Home</router-link>

                <button @click="goBack" class="btn btn-secondary">Go Back</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
    router.go(-1)
}
</script>

<style scoped>
.error-view {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    text-align: center;
    padding: 2rem;
}

.error-container {
    max-width: 600px;
    margin: 0 auto;
}

.error-icon {
    margin-bottom: 2rem;
    opacity: 0.8;
}

.error-title {
    font-size: 6rem;
    font-weight: bold;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.error-subtitle {
    font-size: 2rem;
    margin: 1rem 0;
    font-weight: 300;
}

.error-message {
    font-size: 1.2rem;
    margin: 2rem 0;
    opacity: 0.9;
    line-height: 1.6;
}

.error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 3rem;
}

.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
}

.btn-primary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.5);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .error-title {
        font-size: 4rem;
    }

    .error-subtitle {
        font-size: 1.5rem;
    }

    .error-actions {
        flex-direction: column;
        align-items: center;
    }

    .btn {
        width: 100%;
        max-width: 200px;
    }
}
</style>
