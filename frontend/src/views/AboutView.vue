<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" md="10" lg="8">
                <v-card class="pa-4">
                    <v-card-title class="text-h4 mb-4">About Us</v-card-title>

                    <v-card-text>
                        <p class="text-body-1 mb-6">
                            Welcome to our bookstore! We offer a wide range of books from various genres and authors.
                            Our mission is to provide readers with the best selection of books and a seamless shopping
                            experience.
                        </p>

                        <h2 class="text-h5 mb-3">Our Team</h2>
                        <v-list>
                            <v-list-item>
                                <v-list-item-title>John Doe - Founder & CEO</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title>Jane Smith - Chief Editor</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title>Emily Johnson - Marketing Manager</v-list-item-title>
                            </v-list-item>
                        </v-list>

                        <h2 class="text-h5 mb-3 mt-6">Contact Us</h2>
                        <p class="text-body-1">
                            If you have any questions or feedback, feel free to reach out to us at
                            <a href="mailto:info@bookstore.com" class="text-decoration-none">info@bookstore.com</a>.
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'AboutView',
}
</script>
