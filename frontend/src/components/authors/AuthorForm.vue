<template>
    <base-modal size="medium" @close="$emit('close')">
        <form class="author-form" @submit.prevent="handleSubmit">
            <h2>{{ form._id ? 'Edit Author' : 'Create Author' }}</h2>
            <div class="form-group">
                <label for="name">Name</label>
                <input 
                    id="name"
                    v-model="form.name"
                    type="text"
                    required
                />
            </div>

            <div class="form-group">
                <label for="biography">Biography</label>
                <textarea 
                    id="biography"
                    v-model="form.biography"
                    rows="5"
                ></textarea>
            </div>

            <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="loading"
            >
                {{ loading ? 'Saving...' : (form._id ? 'Update Author' : 'Create Author') }}
            </button>
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        </form>
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

<style scoped>
.author-form {
    padding: 2rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--gray-medium);
    border-radius: 4px;
}

button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-primary {
    background-color: var(--primary-color);
    color: var(--white);
}

.btn-secondary {
    background-color: var(--gray-medium);
    color: var(--white);
    margin-left: 10px;
}

</style>
