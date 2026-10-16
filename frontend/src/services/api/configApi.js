import baseApi from './baseApi'

/**
 * Config API
 * The shop's own settings: currency, VAT, the shipping fee and the free-shipping
 * threshold (in geller). Texts about these terms are built from them.
 */
export const configApi = {
    fetchPublic: () => baseApi.get('/config/public').then((response) => response.data.data),
}
