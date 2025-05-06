<template>
  <div class="error-view">
    <div class="error-container">
      <div class="error-icon">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      
      <h1 class="error-title">404</h1>
      <h2 class="error-subtitle">Страница не найдена</h2>
      
      <p class="error-message">
        К сожалению, запрашиваемая страница не существует или была перемещена.
      </p>
      
      <div class="error-actions">
        <router-link 
          :to="{ name: 'Home' }" 
          class="btn btn-primary"
        >
          На главную
        </router-link>
        
        <button 
          @click="goBack" 
          class="btn btn-secondary"
        >
          Назад
        </button>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
