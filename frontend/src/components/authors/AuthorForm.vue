<template>
    <base-modal size="medium" @close="$emit('close')">
        <v-card class="pa-4">
            <v-card-title class="text-h5 mb-3">
                {{ form._id ? 'Edit Author' : 'Create Author' }}
            </v-card-title>
            
            <v-form @submit.prevent="handleSubmit">
                <v-card-text>
                    <v-text-field
                        id="name"
                        v-model="form.name"
                        label="Name"
                        variant="outlined"
                        density="comfortable"
                        required
                    ></v-text-field>
                    
                    <v-textarea
                        id="biography"
                        v-model="form.biography"
                        label="Biography"
                        variant="outlined"
                        auto-grow
                        rows="5"
                    ></v-textarea>
                </v-card-text>
                
                <v-card-actions>
                    <v-spacer></v-spacer>
                    
                    <v-btn
                        color="secondary"
                        variant="text"
                        @click="$emit('close')"
                    >
                        Cancel
                    </v-btn>
                    
                    <v-btn
                        color="primary"
                        :loading="loading"
                        type="submit"
                    >
                        {{ loading ? 'Saving...' : (form._id ? 'Update Author' : 'Create Author') }}
                    </v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </base-modal>
</template>

<script>
import BaseModal from '../common/BaseModal.vue'

export default {
    name: 'AuthorForm',
    components: {
        BaseModal
    },
    
    props: {
        initialData: {
            type: Object,
            default: () => ({
                _id: null,
                name: '',
                biography: ''
            })
        },
        loading: Boolean,
    },
    
    emits: ['submit', 'close'],

    data() {
        return {
            form: { ...this.initialData }
        }
    },

    watch: {
        initialData: {
            handler(newData) {
                this.form = { ...newData }
            },
            deep: true
        }
    },

    methods: {
        handleSubmit() {
            this.$emit('submit', { ...this.form })
        }
    }
}
</script>
