## Task Description

Refactor Vue 3 components written with the Options API by extracting redundant or reusable logic into Pinia stores. The goal is to simplify component structure, improve maintainability, and enforce separation of concerns — while preserving all existing behavior and reactivity.

## Refactoring Guidelines

### 🎯 Target Refactoring Areas

Extract into Pinia store:

* Repeated or shared data logic (e.g., loading flags, filters, pagination state)
* Complex computed properties or data derivation logic
* Business logic or data transformation functions
* Asynchronous operations (e.g., API calls)
* Error, status, or success states shared across views
* Boolean toggles or modal/dialog open states
* Sorting, filtering, and search logic
* Lifecycle-coupled state (e.g., onMounted-fetch behavior)

### ⚙️ Pinia Store Requirements

* Use `defineStore` with Options API syntax
* Separate state, actions, and getters clearly
* Keep state flat and serializable
* Make state reactive and easily consumed via `$store` in components
* Group related logic in meaningful store modules (e.g., `useUserStore`, `useProductStore`)
* Expose actions for async workflows (e.g., `fetchProducts`, `submitForm`)

### 🧼 Component Cleanup Goals

* Remove direct data-fetching or heavy computed logic from components
* Replace local state with store-mapped state via `mapState`, `mapActions`, `mapGetters`
* Preserve prop/event/slot interface — components should remain presentation-focused
* Minimize lifecycle hooks in components (delegate to store where possible)
* Retain reactivity and maintain UX behavior exactly as before

### ✅ Refactoring Workflow

1. Analyze the component to identify logic that belongs in the store
2. Move that logic into a named Pinia store module
3. Replace component data/computed/methods with `mapState`, `mapActions`, etc.
4. Remove any obsolete logic or unused imports
5. Confirm that the component still works, looks, and reacts as before
6. Document store actions if needed for clarity

### 🔒 Technical Constraints

* Do **not** use Composition API
* Stick to Options API in both component and store definitions
* Ensure full backward compatibility with existing codebase

### Example Store Pattern

```ts
// stores/userStore.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    loading: false,
    error: null
  }),
  getters: {
    userCount: state => state.users.length
  },
  actions: {
    async fetchUsers() {
      this.loading = true
      try {
        const res = await fetch('/api/users')
        this.users = await res.json()
      } catch (e) {
        this.error = e
      } finally {
        this.loading = false
      }
    }
  }
})
```

### In Component (Options API)

```js
export default {
  computed: {
    ...mapState(useUserStore, ['users', 'loading']),
    ...mapGetters(useUserStore, ['userCount'])
  },
  methods: {
    ...mapActions(useUserStore, ['fetchUsers'])
  },
  mounted() {
    this.fetchUsers()
  }
}
```

## Goals Recap

* Clean, DRY, maintainable code
* Thin, readable components focused on UI
* Logic centralized in scalable, testable Pinia stores
* Consistent, elegant project architecture
