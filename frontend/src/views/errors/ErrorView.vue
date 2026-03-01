<template>
    <v-container class="fill-height">
        <v-row justify="center" align="center">
            <v-col cols="12" sm="8" md="6" class="text-center">
                <v-icon icon="mdi-alert-circle-outline" size="80" color="error" class="mb-4" />
                <h1 class="text-h2 font-weight-bold mb-2">Oops!</h1>
                <h2 class="text-h5 text-medium-emphasis mb-4">Something went wrong</h2>
                <p class="text-body-1 text-medium-emphasis mb-6">
                    An unexpected error occurred. We're already working on fixing it.
                </p>

                <v-expand-transition>
                    <v-alert
                        v-if="errorMessage"
                        type="error"
                        variant="tonal"
                        class="text-left mb-6"
                        closable
                        density="compact"
                    >
                        <pre class="text-caption" style="white-space: pre-wrap; word-break: break-word">{{
                            errorMessage
                        }}</pre>
                    </v-alert>
                </v-expand-transition>

                <div class="d-flex justify-center ga-3">
                    <v-btn color="primary" :to="{ name: 'Home' }" prepend-icon="mdi-home-outline"> Go Home </v-btn>
                    <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="reloadPage"> Reload Page </v-btn>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const errorMessage = ref('')

onMounted(() => {
    errorMessage.value = route.query.message || route.params.error || ''
})

const reloadPage = () => {
    window.location.reload()
}
</script>
