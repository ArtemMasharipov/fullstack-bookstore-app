<template>
    <v-navigation-drawer v-model="drawer" permanent color="grey-lighten-5" width="280" class="admin-sidebar">
        <!-- Sidebar Header -->
        <v-list-item class="pa-4 bg-primary">
            <template v-slot:prepend>
                <v-icon color="white" size="large">mdi-view-dashboard</v-icon>
            </template>
            <v-list-item-title class="text-white text-h6 font-weight-medium"> Admin Dashboard </v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <!-- Main Navigation -->
        <v-list density="compact" nav>
            <v-list-item
                v-for="item in mainItems"
                :key="item.id"
                :to="item.to"
                :prepend-icon="item.icon"
                :title="item.title"
                :subtitle="item.subtitle"
                class="mb-1"
                rounded="xl"
            ></v-list-item>
        </v-list>

        <v-divider class="my-4"></v-divider>

        <!-- System Navigation -->
        <v-list density="compact" nav>
            <v-list-subheader>System</v-list-subheader>

            <v-list-item
                v-for="item in systemItems"
                :key="item.id"
                :to="item.to"
                :prepend-icon="item.icon"
                :title="item.title"
                class="mb-1"
                rounded="xl"
            ></v-list-item>
        </v-list>

        <!-- Footer -->
        <template v-slot:append>
            <div class="pa-4 text-center">
                <v-chip color="primary" variant="tonal" size="small" prepend-icon="mdi-shield-check">
                    Admin Access
                </v-chip>
                <div class="text-caption text-grey mt-2">Bookstore v2.0</div>
            </div>
        </template>
    </v-navigation-drawer>
</template>

<script setup>
import { computed, ref } from 'vue'
import { buildAdminNav } from '@/router/buildRoutes'

/**
 * AdminSidebar — nav items are driven by the route manifest via buildAdminNav().
 * Adding or removing an admin route automatically updates this sidebar;
 * no manual sync is required.
 */

const drawer = ref(true)

const adminNav = buildAdminNav()

const mainItems = computed(() => adminNav.main ?? [])
const systemItems = computed(() => adminNav.system ?? [])
</script>

<style scoped>
.admin-sidebar {
    border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.v-list-item--active {
    background-color: rgba(var(--v-theme-primary), 0.1);
    color: rgb(var(--v-theme-primary));
}

.v-list-item--active .v-icon {
    color: rgb(var(--v-theme-primary));
}
</style>
