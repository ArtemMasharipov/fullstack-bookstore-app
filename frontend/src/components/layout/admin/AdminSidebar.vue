<template>
    <v-navigation-drawer v-model="drawer" permanent color="grey-lighten-5" width="280" class="admin-sidebar">
        <!-- Sidebar Header -->
        <v-list-item class="pa-4 bg-primary">
            <template v-slot:prepend>
                <v-icon color="white" size="large" icon="mdi-view-dashboard"></v-icon>
            </template>
            <v-list-item-title class="text-white text-h6 font-weight-medium">
                {{ t('nav.adminDashboard') }}
            </v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <!-- Main Navigation -->
        <v-list density="compact" nav>
            <v-list-item
                v-for="item in mainItems"
                :key="item.id"
                :to="localeRoute(item.id)"
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
            <v-list-subheader>{{ t('nav.system') }}</v-list-subheader>

            <v-list-item
                v-for="item in systemItems"
                :key="item.id"
                :to="localeRoute(item.id)"
                :prepend-icon="item.icon"
                :title="t(item.titleKey)"
                class="mb-1"
                rounded="xl"
            ></v-list-item>
        </v-list>

        <!-- Footer -->
        <template v-slot:append>
            <div class="pa-4 text-center">
                <v-chip color="primary" variant="tonal" size="small" prepend-icon="mdi-shield-check">
                    {{ t('nav.adminAccess') }}
                </v-chip>
                <div class="text-caption text-grey mt-2">{{ t('admin.version', { version: '2.0' }) }}</div>
            </div>
        </template>
    </v-navigation-drawer>
</template>

<script setup>
import { localeRoute } from '@/router/locale'
import { t } from '@/i18n'
import { computed, ref } from 'vue'
import { buildAdminNav } from '@/router/buildRoutes'

/**
 * AdminSidebar — nav items are driven by the route manifest via buildAdminNav().
 * Adding or removing an admin route automatically updates this sidebar;
 * no manual sync is required.
 */

const drawer = ref(true)

const adminNav = computed(() =>
    Object.fromEntries(
        Object.entries(buildAdminNav()).map(([section, items]) => [
            section,
            items.map((item) => ({
                ...item,
                title: t(item.titleKey),
                subtitle: item.subtitleKey ? t(item.subtitleKey) : undefined,
            })),
        ])
    )
)

const mainItems = computed(() => adminNav.value.main ?? [])
const systemItems = computed(() => adminNav.value.system ?? [])
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
