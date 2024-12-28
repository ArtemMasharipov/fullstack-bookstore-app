<template>
  <div class="register">
    <h1>Register</h1>
    <register-form />
  </div>
</template>

<script>
import RegisterForm from '@/components/auth/RegisterForm.vue';

export default {
  name: 'RegisterView',
  components: {
    RegisterForm,
  },
};
</script>

<style scoped>
.register {
  padding: 2rem;
  max-width: 400px;
  margin: 0 auto;
}
.register h1 {
  color: #333;
}
</style>