<template>
    <v-container class="fill-height" fluid>
        <v-row justify="center" align="center">
            <v-col cols="12" sm="8" md="6" lg="4">
                <v-card class="elevation-3">
                    <v-card-title class="text-center">Register</v-card-title>
                    <v-card-text>
                        <register-form />
                    </v-card-text>
                    <v-card-actions>
                        <v-row>
                            <v-col class="text-center">
                                Already have an account?
                                <v-btn variant="text" color="primary" to="/login" class="ps-1" density="compact">
                                    Login
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import RegisterForm from '@/components/features/auth/RegisterForm.vue'

export default {
    name: 'RegisterView',
    components: {
        RegisterForm,
    },
}
</script>
