<template>
    <v-container>
        <v-card class="pa-4">
            <v-card-title class="text-h5 mb-2"> Coming Soon </v-card-title>
            <v-card-subtitle> This feature is being reimplemented </v-card-subtitle>
            <v-card-text>
                <p>
                    We are currently rebuilding this part of the application with a new architecture. It will be
                    available soon with improved functionality and better user experience.
                </p>
            </v-card-text>
            <v-card-actions>
                <v-btn color="primary" to="/">Back to Home</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>

<script>
export default {
    name: 'PlaceholderView',
}
</script>
