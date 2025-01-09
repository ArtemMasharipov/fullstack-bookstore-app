<template>
  <div class="contact">
    <h1>Contact Us</h1>
    <div class="contact-content">
      <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      <div class="contact-info">
        <p>Email: support@bookstore.com</p>
        <p>Phone: (555) 123-4567</p>
        <p>Address: 123 Book Street, Reading City, RC 12345</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContactView'
}
</script>

<style scoped>
.contact {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}
.contact h1 {
  color: #333;
  margin-bottom: 2rem;
}
.contact-content {
  color: #666;
}
.contact-info {
  margin-top: 2rem;
}
</style>
