const legacySfc = require('./eslint-legacy-sfc.json')

module.exports = {
    root: true,
    env: {
        node: true,
        'vue/setup-compiler-macros': true,
    },
    extends: [
        'plugin:vue/vue3-essential',
        'eslint:recommended',
        'plugin:prettier/recommended',
        'prettier', // eslint-config-prettier: MUST be last — disables rules that conflict with Prettier
    ],
    parserOptions: {
        ecmaVersion: 2020,
    },
    overrides: [{ files: legacySfc, rules: { 'vue/no-bare-strings-in-template': 'off' } }],
    rules: {
        'vue/no-bare-strings-in-template': [
            'error',
            {
                allowlist: [
                    '(',
                    ')',
                    ',',
                    '.',
                    '&',
                    '+',
                    '-',
                    '=',
                    '*',
                    '/',
                    '#',
                    '%',
                    '!',
                    '?',
                    ':',
                    '[',
                    ']',
                    '{',
                    '}',
                    '<',
                    '>',
                    '·',
                    '•',
                    '‐',
                    '–',
                    '—',
                    '−',
                    '|',
                    '©',
                    'Bookstore',
                ],
                attributes: {
                    '/.+/': [
                        'label',
                        'subtitle',
                        'placeholder',
                        'title',
                        'hint',
                        'alt',
                        'aria-label',
                        'aria-placeholder',
                        'aria-roledescription',
                        'aria-valuetext',
                    ],
                },
                directives: ['v-text'],
            },
        ],
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'vue/valid-v-slot': ['error', { allowModifiers: true }],
        'no-restricted-imports': [
            'error',
            {
                paths: [
                    {
                        name: 'pinia',
                        importNames: ['mapGetters', 'mapActions', 'mapStores'],
                        message:
                            "Please don't use map* helpers from Pinia. Call the store composable (for example useBooksStore()) and use storeToRefs for reactive state.",
                    },
                ],
            },
        ],
    },
}
