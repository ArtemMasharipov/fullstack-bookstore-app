import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import configPrettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

const legacySfc = JSON.parse(readFileSync(new URL('./eslint-legacy-sfc.json', import.meta.url), 'utf8'))

export default [
    // The same files the former `--ignore-path .gitignore` skipped.
    includeIgnoreFile(fileURLToPath(new URL('./.gitignore', import.meta.url))),
    { files: ['**/*.{js,jsx,cjs,mjs,vue}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    ...pluginVue.configs['flat/essential'],
    js.configs.recommended,
    // eslint-plugin-prettier 4 has no flat preset: this is its `recommended` config.
    {
        plugins: { prettier: pluginPrettier },
        rules: { 'prettier/prettier': 'error', 'arrow-body-style': 'off', 'prefer-arrow-callback': 'off' },
    },
    configPrettier, // eslint-config-prettier: MUST be last of the presets — disables rules that conflict with Prettier
    { languageOptions: { ecmaVersion: 2020 } },
    {
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
    },
    { files: legacySfc, rules: { 'vue/no-bare-strings-in-template': 'off' } },
]
