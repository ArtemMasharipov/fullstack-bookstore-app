<template>
    <v-app-bar color="primary" flat :height="xs ? 112 : 64">
        <div class="admin-header d-flex align-center px-2">
            <v-app-bar-nav-icon
                v-if="!mdAndUp"
                class="text-white"
                :aria-label="t('nav.openMenu')"
                :aria-expanded="drawer ? 'true' : 'false'"
                @click="drawer = !drawer"
            />
            <span class="admin-title text-h6 ms-2">{{ t('nav.admin') }}</span>

            <v-spacer />

            <LanguageSwitcher class="admin-languages text-white me-2" />

            <v-menu>
                <template #activator="{ props }">
                    <v-btn v-bind="props" variant="text" class="admin-account text-white text-none">
                        <v-icon start icon="mdi-account-circle" />
                        <span class="text-truncate">{{ accountName }}</span>
                        <v-icon end icon="mdi-chevron-down" />
                    </v-btn>
                </template>
                <v-list density="compact" min-width="200">
                    <v-list-item
                        :to="localeRoute('Profile')"
                        prepend-icon="mdi-account-outline"
                        :title="t('routes.Profile')"
                    />
                    <v-list-item
                        :to="localeRoute('Home')"
                        prepend-icon="mdi-storefront-outline"
                        :title="t('nav.returnStore')"
                    />
                    <v-divider class="my-1" />
                    <v-list-item prepend-icon="mdi-logout" :title="t('nav.logout')" @click="logout" />
                </v-list>
            </v-menu>
        </div>
    </v-app-bar>

    <v-navigation-drawer
        v-model="drawer"
        class="admin-drawer"
        :aria-label="t('admin.navLabel')"
        :permanent="mdAndUp"
        :temporary="!mdAndUp"
        width="256"
    >
        <ul class="admin-nav">
            <li v-for="item in items" :key="item.id">
                <router-link v-slot="{ href, navigate }" :to="localeRoute(item.id)" custom>
                    <a
                        :href="href"
                        class="admin-nav__link"
                        :class="{ 'admin-nav__link--current': isCurrent(item) }"
                        :aria-current="isCurrent(item) ? 'page' : undefined"
                        @click="navigate"
                    >
                        <v-icon :icon="item.icon" size="small" />
                        <span class="admin-nav__text">
                            <span class="admin-nav__title">{{ t(item.titleKey) }}</span>
                            <span class="admin-nav__subtitle">{{ t(item.subtitleKey) }}</span>
                        </span>
                    </a>
                </router-link>
            </li>
        </ul>
    </v-navigation-drawer>

    <v-main>
        <v-container fluid>
            <h1 class="text-h5 font-weight-bold mb-4">{{ t(route.meta.titleKey) }}</h1>
            <router-view />
        </v-container>
    </v-main>
</template>

<script setup>
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import { t } from '@/i18n'
import { buildAdminNav } from '@/router/buildRoutes'
import { localeRoute } from '@/router/locale'
import { useAuthStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

/**
 * The admin area: one app bar, one navigation and one main with the section's heading. The navigation is a plain
 * list of links: Vuetify's list is a listbox, which a set of page links is not. It stays open from md up; below
 * that it opens from the menu button and closes after a link.
 */

const route = useRoute()
const router = useRouter()
const { mdAndUp, xs } = useDisplay()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const items = buildAdminNav().main ?? []
const accountName = computed(() => user.value?.username || t('admin.userFallback'))

const drawer = ref(mdAndUp.value)
watch(mdAndUp, (wide) => {
    drawer.value = wide
})
watch(
    () => route.fullPath,
    () => {
        if (!mdAndUp.value) drawer.value = false
    }
)

// The dashboard is current on its own page only; another section also on the pages below it
const isCurrent = (item) =>
    item.id === 'AdminDashboard'
        ? route.name === 'AdminDashboard'
        : route.path.startsWith(router.resolve(localeRoute(item.id)).path)

// Every admin page needs an account, so the session's end opens Login
const logout = () => authStore.logout()
</script>

<style scoped>
.admin-header {
    width: 100%;
}

.admin-title {
    white-space: nowrap;
}

.admin-account {
    max-width: 14rem;
}

.v-app-bar .v-btn.text-white {
    color: white !important;
}

@media (max-width: 599px) {
    .admin-header {
        flex-wrap: wrap;
    }

    .admin-languages {
        order: 1;
        flex-basis: 100%;
        justify-content: center;
        margin-right: 0 !important;
    }
}

/* A closed drawer is only moved out of view: hidden, its links leave the tab order too */
.admin-drawer:not(.v-navigation-drawer--active) {
    visibility: hidden;
}

.admin-nav {
    list-style: none;
    margin: 0;
    padding: 8px;
}

.admin-nav__link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    margin-bottom: 4px;
    padding: 8px 12px;
    border-radius: 8px;
    color: rgb(var(--v-theme-on-surface));
    text-decoration: none;
}

.admin-nav__link:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.06);
}

/* The current section: a tint and a bar, with the text in the normal colour, readable in both themes */
.admin-nav__link--current {
    background-color: rgba(var(--v-theme-primary), 0.12);
    box-shadow: inset 4px 0 0 rgb(var(--v-theme-primary));
    font-weight: 600;
}

.admin-nav__text {
    display: flex;
    flex-direction: column;
}

.admin-nav__subtitle {
    font-size: 0.75rem;
    font-weight: 400;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
