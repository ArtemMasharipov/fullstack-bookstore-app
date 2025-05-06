<template>
  <v-footer color="primary" app class="pa-0">
    <v-container fluid>
      <v-row justify="center" align="center" class="py-4">
        <!-- Company information -->
        <v-col cols="12" md="4" class="text-center text-md-start">
          <div class="d-flex align-center justify-center justify-md-start">
            <v-avatar class="mr-2" color="white" size="36">
              <v-img src="/favicon.ico" alt="BookStore Logo"></v-img>
            </v-avatar>
            <h3 class="text-white text-h6 font-weight-bold mb-0">BookStore</h3>
          </div>
          
          <p class="text-white text-caption mt-3 mb-0 px-4 px-md-0">
            Your one-stop destination for quality books. We offer a wide selection of genres for all reading tastes.
          </p>
        </v-col>
        
        <!-- Navigation links -->
        <v-col cols="12" md="4" class="text-center my-4 my-md-0">
          <h4 class="text-white text-subtitle-2 font-weight-bold mb-2 d-none d-md-block">Quick Links</h4>
          <div class="d-flex justify-center flex-wrap">
            <v-btn 
              v-for="link in quickLinks" 
              :key="link.path"
              variant="text" 
              :to="link.path" 
              class="text-white mx-1 px-2"
              density="comfortable"
            >
              {{ link.title }}
            </v-btn>
          </div>
        </v-col>
        
        <!-- Social media and copyright -->
        <v-col cols="12" md="4" class="text-center text-md-end">
          <h4 class="text-white text-subtitle-2 font-weight-bold mb-2 d-none d-md-block">Connect With Us</h4>
          <div class="d-flex justify-center justify-md-end">
            <v-btn 
              v-for="social in socialLinks" 
              :key="social.icon"
              :icon="social.icon" 
              variant="text" 
              class="text-white mx-1" 
              :href="social.url" 
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.label"
            ></v-btn>
          </div>
          <p class="text-white text-caption mt-3 mb-0">
            &copy; {{ currentYear }} BookStore. All rights reserved.
          </p>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script>
/**
 * Application footer component
 * Provides navigation links, social media links, and copyright information
 */
export default {
  name: 'FooterLayout',
  data() {
    return {
      quickLinks: [
        { title: 'Home', path: '/' },
        { title: 'Books', path: '/books' },
        { title: 'Authors', path: '/authors' },
        { title: 'About Us', path: '/about' },
        { title: 'Contact', path: '/contact' },
        { title: 'Privacy Policy', path: '/privacy' },
      ],
      socialLinks: [
        { icon: 'mdi-facebook', url: '#', label: 'Facebook' },
        { icon: 'mdi-twitter', url: '#', label: 'Twitter' },
        { icon: 'mdi-instagram', url: '#', label: 'Instagram' },
        { icon: 'mdi-youtube', url: '#', label: 'YouTube' }
      ]
    };
  },
  computed: {
    /**
     * Get current year for copyright notice
     */
    currentYear() {
      return new Date().getFullYear();
    }
  }
};
</script>

<style scoped>
/* All styles are now handled by Vuetify utility classes */
</style>