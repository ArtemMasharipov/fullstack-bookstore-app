<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" md="10" lg="8">
                <v-card class="pa-4">
                    <v-card-title class="text-h4 mb-4">Privacy Policy</v-card-title>

                    <v-card-text>
                        <p class="text-caption mb-6">Last updated: {{ currentDate }}</p>

                        <h2 class="text-h5 mb-3 mt-4">Information We Collect</h2>
                        <p class="text-body-1 mb-4">
                            We collect information you provide directly to us when making purchases or creating an
                            account.
                        </p>

                        <h2 class="text-h5 mb-3 mt-4">How We Use Your Information</h2>
                        <p class="text-body-1 mb-4">
                            We use the information we collect to provide and improve our services, process your orders,
                            and communicate with you.
                        </p>

                        <h2 class="text-h5 mb-3 mt-4">Cookies</h2>
                        <p class="text-body-1 mb-4">
                            We use cookies to enhance your browsing experience, analyze site traffic, and personalize
                            content. By continuing to use our website, you consent to our use of cookies.
                        </p>

                        <h2 class="text-h5 mb-3 mt-4">Third-Party Services</h2>
                        <p class="text-body-1 mb-4">
                            We may use third-party services to process payments, send newsletters, or analyze our
                            website traffic. These third parties have their own privacy policies.
                        </p>

                        <h2 class="text-h5 mb-3 mt-4">Data Security</h2>
                        <p class="text-body-1 mb-4">
                            We implement appropriate security measures to protect your personal information. However, no
                            data transmission over the internet can be guaranteed to be 100% secure.
                        </p>

                        <h2 class="text-h5 mb-3 mt-4">Contact Us</h2>
                        <p class="text-body-1">
                            If you have any questions about our Privacy Policy, please contact us at
                            privacy@bookstore.com.
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'PrivacyView',
    computed: {
        currentDate() {
            return new Date().toLocaleDateString()
        },
    },
}
</script>
