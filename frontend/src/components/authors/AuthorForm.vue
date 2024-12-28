<template>
    <div class="author-form-container">
        <form class="author-form" @submit.prevent="handleSubmit">
            <h2>{{ form.id ? 'Edit Author' : 'Create Author' }}</h2>
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
                {{ loading ? 'Saving...' : (form.id ? 'Update Author' : 'Create Author') }}
            </button>
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        </form>
    </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'AuthorForm',
    
    props: {
        initialData: {
            type: Object,
            default: () => ({}),
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    
    emits: ['submit', 'close'],

    data() {
        return {
            form: {
                name: '',
                biography: '',
                ...this.initialData,
            },
        };
    },

    computed: {
        ...mapGetters('authors', ['authorsLoading']),
    },

    methods: {
        ...mapActions('authors', ['createAuthor', 'updateAuthor']),

        async handleSubmit() {
            try {
                if (this.form.id) {
                    await this.updateAuthor(this.form);
                } else {
                    await this.createAuthor(this.form);
                }
                this.$emit('close');
            } catch (error) {
                console.error('Error saving author:', error);
            }
        },
    },
};
</script>

<style scoped>
.author-form-container {
    background: rgba(0, 0, 0, 0.5);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.author-form {
    background: var(--white);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 500px;
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
