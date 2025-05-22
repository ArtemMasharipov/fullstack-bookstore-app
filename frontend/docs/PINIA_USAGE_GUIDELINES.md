# Pinia Usage Guidelines for Vue 3 Options API

This document outlines the standard approach for using Pinia stores with Vue 3 Options API in our project.

## Core Principles

- **Consistency**: Use the same approach across all components
- **Maintainability**: Code should be easy to understand and maintain
- **Readability**: Store access should be explicit and clear
- **DRY (Don't Repeat Yourself)**: Avoid unnecessary duplication
- **KISS (Keep It Simple, Stupid)**: Prefer simple, straightforward approaches

## Recommended Approach

### Standard Pattern

For all components using Pinia with Options API, follow this pattern:

```js
import { useMyStore } from '@/store';

export default {
  computed: {
    // Store instance accessor
    myStore() {
      return useMyStore();
    },
    
    // Properties from store
    myProperty() {
      return this.myStore.myProperty;
    },
    anotherProperty() {
      return this.myStore.anotherProperty;
    }
  },
  
  methods: {
    // Methods that interact with store
    async doSomething() {
      await this.myStore.doSomething();
    }
  }
};
```

### Key Points:

1. Always define a computed property that returns the store instance
2. Access store state and getters through explicit computed properties
3. Call store actions directly from component methods
4. Use explicit names that make it clear which store is being used

## Utility Helpers (Optional)

For components that access many properties from the same store, you can use the provided utility functions to reduce boilerplate:

```js
import { useMyStore } from '@/store';
import { useStoreProperties, useStoreMethods } from '@/utils/storeComposable';

export default {
  computed: {
    // Map multiple properties at once
    ...useStoreProperties(useMyStore, [
      'property1',
      'property2',
      'isLoading'
    ], 'my') // Creates: myStore, property1, property2, isLoading
  },
  
  methods: {
    // Map multiple methods at once
    ...useStoreMethods(useMyStore, [
      'doSomething',
      'doSomethingElse'
    ])
  }
};
```

## Approaches to Avoid

- **No mapActions/mapGetters/mapStores**: Don't use these helpers from Pinia, as they make the code less explicit
- **No mixed approaches**: Don't mix different styles within the same component or project
- **No direct store imports in template**: Always access stores through computed properties

## Examples

Check out these example components that demonstrate the preferred approaches:

- `@/components/examples/PiniaStandardTemplate.vue` - Shows the standard approach
- `@/components/examples/PiniaUtilityTemplate.vue` - Shows using utility helpers

## Migration

When updating existing components, convert them to follow the standard pattern. This ensures:

- Consistent code style across the project
- Better IDE autocomplete support
- Clearer dependency tracking
- Improved maintainability
