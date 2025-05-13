<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h3 mb-6">Admin Dashboard</h1>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-item>
            <v-card-title>Books Management</v-card-title>
          </v-card-item>
          <v-card-text class="pb-0">Manage your books catalog - add, edit, or remove books.</v-card-text>
          <v-card-actions class="pt-0">
            <v-spacer></v-spacer>
            <v-btn color="primary" to="/admin/books" prepend-icon="mdi-book-multiple">
              Manage Books
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-item>
            <v-card-title>Authors Management</v-card-title>
          </v-card-item>
          <v-card-text class="pb-0">Manage authors - add new authors, update information, or delete.</v-card-text>
          <v-card-actions class="pt-0">
            <v-spacer></v-spacer>
            <v-btn color="primary" to="/admin/authors" prepend-icon="mdi-account-multiple">
              Manage Authors
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-item>
            <v-card-title>Orders Management</v-card-title>
          </v-card-item>
          <v-card-text class="pb-0">View and manage all customer orders.</v-card-text>
          <v-card-actions class="pt-0">
            <v-spacer></v-spacer>
            <v-btn color="primary" to="/admin/orders" prepend-icon="mdi-package-variant">
              Manage Orders
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'AdminDashboardView',
}
</script>
