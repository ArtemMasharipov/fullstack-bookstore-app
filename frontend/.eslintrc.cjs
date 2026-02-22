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
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-restricted-imports': [
            'error',
            {
                paths: [
                    {
                        name: 'pinia',
                        importNames: ['mapGetters', 'mapActions', 'mapStores'],
                        message:
                            "Please don't use map* helpers from Pinia. Follow our standard approach from docs/PINIA_USAGE_GUIDELINES.md",
                    },
                ],
            },
        ],
    },
}
