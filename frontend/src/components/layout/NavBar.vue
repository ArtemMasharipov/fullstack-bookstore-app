<template>
    <nav class="navbar">
        <div class="navbar-brand">
            <router-link to="/" class="brand-logo">BookStore</router-link>
        </div>

        <div class="navbar-menu">
            <router-link to="/books" class="nav-link">Books</router-link>
            <router-link to="/authors" class="nav-link">Authors</router-link>
            <router-link to="/cart" class="nav-link">Cart</router-link>

            <template v-if="isAuthenticated">
                <span class="user-name">{{ currentUser?.username }}</span>
                <button class="nav-link btn-logout" @click="logout">Logout</button>
            </template>
            <template v-else>
                <router-link to="/login" class="nav-link">Login</router-link>
                <router-link to="/register" class="nav-link btn-primary">Register</router-link>
            </template>
        </div>
    </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
    name: 'NavBar',
    computed: {
        ...mapGetters('auth', ['authToken', 'currentUser']),
        isAuthenticated() {
            return this.authToken !== null;
        },
    },
    methods: {
        ...mapActions('auth', ['logout']),
    },
};
</script>

<style scoped>
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.navbar-brand .brand-logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--white);
    text-decoration: none;
}

.navbar-menu {
    display: flex;
    align-items: center;
}

.nav-link {
    margin: 0 0.5rem;
    color: var(--white);
    text-decoration: none;
}

.nav-link:hover {
    text-decoration: underline;
}

.nav-link.router-link-active {
    font-weight: bold;
    border-bottom: 2px solid var(--white);
}

.btn-logout {
    background: none;
    border: none;
    color: var(--white);
    cursor: pointer;
}

.user-name {
    margin-right: 1rem;
    color: var(--white);
}
</style>
