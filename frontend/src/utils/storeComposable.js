/**
 * Utility function to create a consistent store interface for Options API components.
 *
 * This helper makes it easier to follow a consistent pattern when using Pinia stores
 * in the Options API. Instead of manually defining a computed property for each
 * store property or method, you can use this helper to generate them.
 *
 * @param {Object} storeInstance The Pinia store instance
 * @param {Array|Object} props Properties to map (array of strings or object with local name as key and store property as value)
 * @param {String} prefix Optional prefix to add to the property names
 * @return {Object} An object with computed properties or methods that can be spread into a component's computed or methods section
 */
export const useStoreProperties = (storeFn, props = [], prefix = '') => {
    const computed = {}

    // Add the store instance itself first
    const storeKey = prefix ? `${prefix}Store` : 'store'
    computed[storeKey] = function () {
        return storeFn()
    }

    // Process the properties list
    if (Array.isArray(props)) {
        // If props is an array, use the same name for both component property and store property
        props.forEach((prop) => {
            computed[prop] = function () {
                return this[storeKey][prop]
            }
        })
    } else {
        // If props is an object, use the key as component property name and value as store property name
        Object.entries(props).forEach(([localName, storeProp]) => {
            computed[localName] = function () {
                return this[storeKey][storeProp]
            }
        })
    }

    return computed
}

/**
 * Map store methods to component methods.
 *
 * @param {Function} storeFn The Pinia store function
 * @param {Array|Object} methods Methods to map (array of strings or object with local name as key and store method as value)
 * @return {Object} An object with methods that can be spread into a component's methods section
 */
export const useStoreMethods = (storeFn, methods = []) => {
    const result = {}
    const storeKey = 'store'

    // Add the store instance itself first
    result[storeKey] = function () {
        return storeFn()
    }

    // Process the methods list
    if (Array.isArray(methods)) {
        // If methods is an array, use the same name for both component method and store method
        methods.forEach((method) => {
            result[method] = function (...args) {
                return this[storeKey][method](...args)
            }
        })
    } else {
        // If methods is an object, use the key as component method name and value as store method name
        Object.entries(methods).forEach(([localName, storeMethod]) => {
            result[localName] = function (...args) {
                return this[storeKey][storeMethod](...args)
            }
        })
    }

    return result
}
