<template>
  <div class="error-view">
    <div class="error-container">
      <div class="error-icon">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      
      <h1 class="error-title">Упс!</h1>
      <h2 class="error-subtitle">Что-то пошло не так</h2>
      
      <p class="error-message">
        Произошла неожиданная ошибка. Мы уже работаем над её устранением.
      </p>
      
      <div class="error-details" v-if="errorMessage">
        <details>
          <summary>Подробности ошибки</summary>
          <pre>{{ errorMessage }}</pre>
        </details>
      </div>
      
      <div class="error-actions">
        <router-link 
          :to="{ name: 'Home' }" 
          class="btn btn-primary"
        >
          На главную
        </router-link>
        
        <button 
          @click="reloadPage" 
          class="btn btn-secondary"
        >
          Обновить страницу
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const errorMessage = ref('')

onMounted(() => {
  // Получаем сообщение об ошибке из query параметров или состояния
  errorMessage.value = route.query.message || route.params.error || ''
})

const reloadPage = () => {
  window.location.reload()
}
</script>

<style scoped>
.error-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
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
  font-size: 4rem;
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

.error-details {
  margin: 2rem 0;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  margin-bottom: 1rem;
  font-weight: 500;
}

.error-details pre {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
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
    font-size: 3rem;
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
