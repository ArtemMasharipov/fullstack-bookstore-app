<template>
  <div>
    <h1>User Management</h1>
    <div v-if="loading">Loading...</div>
    <div v-if="error">{{ error }}</div>
    <div v-if="isAdmin">
      <button @click="fetchUsers">Fetch Users</button>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.email }}
          <button @click="deleteUser(user.id)">Delete</button>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>You do not have permission to view this page.</p>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'UserManagement',
  computed: {
    ...mapGetters('users', ['usersList', 'usersLoading', 'usersError']),
    ...mapGetters('auth', ['isAdmin']),
    users() {
      return this.usersList
    },
    loading() {
      return this.usersLoading
    },
    error() {
      return this.usersError
    }
  },
  created() {
    if (this.isAdmin) {
      this.fetchUsers()
    }
  },
  methods: {
    ...mapActions('users', ['fetchUsers', 'deleteUser'])
  }
}
</script>