<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" md="8" lg="6">
                <v-card class="pa-4">
                    <v-card-title class="text-h4 mb-4">Contact Us</v-card-title>

                    <v-card-text>
                        <p class="text-body-1 mb-6">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as
                            possible.
                        </p>

                        <v-list density="compact" class="bg-transparent pa-0">
                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon color="primary" class="me-2">mdi-email</v-icon>
                                </template>
                                <v-list-item-title>Email: support@bookstore.com</v-list-item-title>
                            </v-list-item>

                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon color="primary" class="me-2">mdi-phone</v-icon>
                                </template>
                                <v-list-item-title>Phone: (555) 123-4567</v-list-item-title>
                            </v-list-item>

                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon color="primary" class="me-2">mdi-map-marker</v-icon>
                                </template>
                                <v-list-item-title>Address: 123 Book Street, Reading City, RC 12345</v-list-item-title>
                            </v-list-item>
                        </v-list>

                        <v-form class="mt-6">
                            <v-text-field
                                label="Your Name"
                                variant="outlined"
                                placeholder="Enter your full name"
                            ></v-text-field>

                            <v-text-field
                                label="Email"
                                variant="outlined"
                                type="email"
                                placeholder="Enter your email address"
                            ></v-text-field>

                            <v-textarea
                                label="Message"
                                variant="outlined"
                                placeholder="How can we help you?"
                                rows="4"
                            ></v-textarea>

                            <v-btn color="primary" block class="mt-4"> Send Message </v-btn>
                        </v-form>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'ContactView',
}
</script>
