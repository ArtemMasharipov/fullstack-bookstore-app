<template>
    <v-container class="fill-height" fluid>
        <v-row justify="center" align="center">
            <!-- Branding side (desktop only) -->
            <v-col cols="12" md="5" class="d-none d-md-flex flex-column align-center justify-center">
                <v-icon icon="mdi-account-plus-outline" size="80" color="primary" class="mb-4" />
                <h2 class="text-h4 font-weight-bold text-center mb-2">Join Us</h2>
                <p class="text-body-1 text-medium-emphasis text-center">
                    Create an account to start shopping, track your orders, and get personalized book recommendations.
                </p>
            </v-col>

            <v-divider vertical class="d-none d-md-block mx-6" />

            <!-- Form side -->
            <v-col cols="12" sm="8" md="5" lg="4">
                <v-card class="pa-2" elevation="0" color="transparent">
                    <v-card-title class="text-h5 font-weight-bold text-center d-md-none mb-2">Register</v-card-title>
                    <v-card-text>
                        <register-form />
                        <div class="text-center mt-4">
                            <span class="text-medium-emphasis">Already have an account?</span>
                            <v-btn variant="text" color="primary" to="/login" density="compact"> Login </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import RegisterForm from '@/components/features/auth/RegisterForm.vue'
</script>
