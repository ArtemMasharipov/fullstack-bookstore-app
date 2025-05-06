<template>
  <v-footer color="primary" app>
    <v-container fluid>
      <v-row justify="center" align="center">
        <v-col cols="12" md="4" class="text-center text-md-left">
          <h3 class="text-white text-body-1 font-weight-bold">BookStore</h3>
          <p class="text-white text-caption mt-2">
            Your one-stop destination for quality books
          </p>
        </v-col>
        
        <v-col cols="12" md="4" class="text-center my-3 my-md-0">
          <div class="d-flex justify-center justify-md-center flex-wrap">
            <v-btn variant="text" to="/about" class="text-white mx-1">
              About Us
            </v-btn>
            <v-btn variant="text" to="/contact" class="text-white mx-1">
              Contact
            </v-btn>
            <v-btn variant="text" to="/privacy" class="text-white mx-1">
              Privacy Policy
            </v-btn>
          </div>
        </v-col>
        
        <v-col cols="12" md="4" class="text-center text-md-right">
          <div class="d-flex justify-center justify-md-end">
            <v-btn icon="mdi-facebook" variant="text" class="text-white mx-1" href="#" target="_blank"></v-btn>
            <v-btn icon="mdi-twitter" variant="text" class="text-white mx-1" href="#" target="_blank"></v-btn>
            <v-btn icon="mdi-instagram" variant="text" class="text-white mx-1" href="#" target="_blank"></v-btn>
          </div>
          <p class="text-white text-caption mt-2">
            &copy; {{ new Date().getFullYear() }} BookStore. All rights reserved.
          </p>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script>
export default {
  name: 'FooterLayout',
};
</script>

<style scoped>
.v-footer {
  padding: 16px 0;
}
</style>