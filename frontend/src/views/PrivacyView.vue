<template>
  <div class="privacy">
    <h1>Privacy Policy</h1>
    <div class="privacy-content">
      <p>Last updated: {{ currentDate }}</p>
      <h2>Information We Collect</h2>
      <p>We collect information you provide directly to us when making purchases or creating an account.</p>
      <h2>How We Use Your Information</h2>
      <p>We use the information we collect to provide and improve our services, process your orders, and communicate with you.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PrivacyView',
  computed: {
    currentDate() {
      return new Date().toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.privacy {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}
.privacy h1, .privacy h2 {
  color: #333;
}
.privacy-content {
  color: #666;
}
.privacy h2 {
  margin-top: 1.5rem;
}
</style>
