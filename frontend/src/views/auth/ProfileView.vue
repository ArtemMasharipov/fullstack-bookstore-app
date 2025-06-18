<template>
    <div class="profile-view">
        <div class="container">
            <div class="profile-header">
                <h1>Мой профиль</h1>
                <p class="profile-subtitle">Управление личными данными и настройками</p>
            </div>

            <div class="profile-content">
                <div class="profile-card">
                    <div class="profile-avatar">
                        <div class="avatar-placeholder">
                            {{ userInitials }}
                        </div>
                        <button class="avatar-upload-btn">Изменить фото</button>
                    </div>

                    <div class="profile-info">
                        <form @submit.prevent="updateProfile" class="profile-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="firstName">Имя</label>
                                    <input
                                        id="firstName"
                                        v-model="profile.firstName"
                                        type="text"
                                        class="form-control"
                                        :disabled="!isEditing"
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="lastName">Фамилия</label>
                                    <input
                                        id="lastName"
                                        v-model="profile.lastName"
                                        type="text"
                                        class="form-control"
                                        :disabled="!isEditing"
                                    />
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="email">Email</label>
                                <input id="email" v-model="profile.email" type="email" class="form-control" disabled />
                                <small class="form-text">Email нельзя изменить</small>
                            </div>

                            <div class="form-group">
                                <label for="phone">Телефон</label>
                                <input
                                    id="phone"
                                    v-model="profile.phone"
                                    type="tel"
                                    class="form-control"
                                    :disabled="!isEditing"
                                />
                            </div>

                            <div class="form-actions">
                                <button v-if="!isEditing" type="button" @click="startEditing" class="btn btn-primary">
                                    Редактировать
                                </button>

                                <template v-else>
                                    <button type="submit" class="btn btn-success" :disabled="loading">
                                        {{ loading ? 'Сохранение...' : 'Сохранить' }}
                                    </button>

                                    <button type="button" @click="cancelEditing" class="btn btn-secondary">
                                        Отмена
                                    </button>
                                </template>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="profile-actions-card">
                    <h3>Дополнительные действия</h3>

                    <div class="action-item">
                        <div class="action-info">
                            <h4>Изменить пароль</h4>
                            <p>Обновите пароль для повышения безопасности</p>
                        </div>
                        <button class="btn btn-outline">Изменить</button>
                    </div>

                    <div class="action-item">
                        <div class="action-info">
                            <h4>Мои заказы</h4>
                            <p>Просмотр истории покупок</p>
                        </div>
                        <router-link :to="{ name: 'Orders' }" class="btn btn-outline"> Перейти </router-link>
                    </div>

                    <div class="action-item danger">
                        <div class="action-info">
                            <h4>Удалить аккаунт</h4>
                            <p>Безвозвратное удаление учетной записи</p>
                        </div>
                        <button class="btn btn-danger" @click="confirmDeleteAccount">Удалить</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '@/store'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// Reactive data
const isEditing = ref(false)
const loading = ref(false)
const profile = ref({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
})
const originalProfile = ref({})

// Computed properties
const user = computed(() => authStore.user)
const userInitials = computed(() => {
    const first = profile.value.firstName?.charAt(0) || ''
    const last = profile.value.lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || 'U'
})

// Methods
const loadProfile = () => {
    if (user.value) {
        profile.value = { ...user.value }
        originalProfile.value = { ...user.value }
    }
}

const startEditing = () => {
    isEditing.value = true
    originalProfile.value = { ...profile.value }
}

const cancelEditing = () => {
    isEditing.value = false
    profile.value = { ...originalProfile.value }
}

const updateProfile = async () => {
    loading.value = true
    try {
        await authStore.updateProfile(profile.value)
        isEditing.value = false
    } catch (error) {
        console.error('Error updating profile:', error)
    } finally {
        loading.value = false
    }
}

const confirmDeleteAccount = () => {
    if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
        deleteAccount()
    }
}

const deleteAccount = async () => {
    try {
        await authStore.deleteAccount()
        router.push({ name: 'Home' })
    } catch (error) {
        console.error('Error deleting account:', error)
    }
}

// Lifecycle
onMounted(() => {
    loadProfile()
})
</script>

<style scoped>
.profile-view {
    min-height: 100vh;
    background: #f8f9fa;
    padding: 2rem 0;
}

.container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 1rem;
}

.profile-header {
    text-align: center;
    margin-bottom: 3rem;
}

.profile-header h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.profile-subtitle {
    color: #6c757d;
    font-size: 1.1rem;
}

.profile-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
}

.profile-card,
.profile-actions-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.profile-avatar {
    text-align: center;
    margin-bottom: 2rem;
}

.avatar-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    color: white;
    margin-bottom: 1rem;
}

.avatar-upload-btn {
    display: block;
    margin: 0 auto;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.avatar-upload-btn:hover {
    background: #e9ecef;
}

.profile-form {
    max-width: 500px;
    margin: 0 auto;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #2c3e50;
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.form-control:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
}

.form-text {
    color: #6c757d;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

.form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover {
    background: #5a6fd8;
}

.btn-success {
    background: #28a745;
    color: white;
}

.btn-success:hover {
    background: #218838;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #5a6268;
}

.btn-outline {
    background: transparent;
    color: #667eea;
    border: 1px solid #667eea;
}

.btn-outline:hover {
    background: #667eea;
    color: white;
}

.btn-danger {
    background: #dc3545;
    color: white;
}

.btn-danger:hover {
    background: #c82333;
}

.profile-actions-card h3 {
    margin-bottom: 1.5rem;
    color: #2c3e50;
}

.action-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #f1f3f4;
}

.action-item:last-child {
    border-bottom: none;
}

.action-item.danger {
    color: #dc3545;
}

.action-info h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 500;
}

.action-info p {
    margin: 0;
    font-size: 0.875rem;
    color: #6c757d;
}

@media (max-width: 768px) {
    .profile-content {
        grid-template-columns: 1fr;
    }

    .form-row {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column;
    }

    .action-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
}
</style>
