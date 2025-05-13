<template>
    <v-container class="text-center">
        <v-row justify="center">
            <v-col cols="12" sm="10" md="8">
                <v-card flat class="pa-6 mt-4 bg-transparent">
                    <v-card-title tag="h1" class="text-h3 mb-4">Welcome to Our Bookstore</v-card-title>
                    <v-card-text class="text-body-1 mb-6">
                        Discover a wide range of books from various genres and authors. Enjoy a seamless shopping
                        experience with us.
                    </v-card-text>
                    <v-card-actions class="justify-center">
                        <v-btn color="primary" to="/books" size="large" elevation="2"> Browse Books </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'HomeView',
}
</script>
