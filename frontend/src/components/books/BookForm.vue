<template>
    <div class="book-form-container">
        <form class="book-form" enctype="multipart/form-data" @submit.prevent="handleSubmit">
            <h2>{{ form.id ? 'Edit Book' : 'Create Book' }}</h2>

            <div class="form-group">
                <label for="title">Title</label>
                <input id="title" v-model="form.title" type="text" required />
            </div>

            <div class="form-group">
                <label for="author">Author</label>
                <select id="author" v-model="form.authorId" required>
                    <option v-for="author in authors" :key="author._id" :value="author._id">
                        {{ author.name }}
                    </option>
                </select>
                <p v-if="!authors.length">No authors available. Please add an author first.</p>
            </div>

            <div class="form-group">
                <label for="year">Publication Year</label>
                <input id="year" v-model="form.publicationYear" type="number" required />
            </div>

            <div class="form-group">
                <label for="category">Category</label>
                <input id="category" v-model="form.category" type="text" />
            </div>

            <div class="form-group">
                <label for="image">Book Cover</label>
                <input id="image" type="file" accept="image/*" @change="handleImageUpload" />
                <p v-if="imageError" class="error-message">{{ imageError }}</p>
            </div>

            <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Saving...' : form.id ? 'Update Book' : 'Create Book' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        </form>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
    name: 'BookForm',

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
                title: '',
                authorId: '',
                publicationYear: null,
                category: '',
                ...this.initialData,
            },
            selectedFile: null,
            imageError: null,
        }
    },

    computed: {
        ...mapGetters('authors', ['authorsList']),
        authors() {
            return this.authorsList
        },
    },

    created() {
        this.fetchAuthors()
    },

    methods: {
        ...mapActions('authors', ['fetchAuthors']),
        ...mapActions('books', ['createBook', 'updateBook']),

        handleImageUpload(event) {
            const file = event.target.files[0]
            if (file) {
                if (file.size > 10485760) {
                    // 10MB
                    this.imageError = 'File size should not exceed 10MB'
                    this.selectedFile = null
                    return
                }
                this.imageError = null
                this.selectedFile = file
            }
        },

        async handleSubmit() {
            try {
                const formData = new FormData()
                formData.append('title', this.form.title)
                formData.append('authorId', this.form.authorId)
                formData.append('publicationYear', this.form.publicationYear)
                formData.append('category', this.form.category)

                if (this.selectedFile) {
                    formData.append('image', this.selectedFile)
                }

                if (this.form.id) {
                    await this.updateBook({ id: this.form.id, formData })
                } else {
                    await this.createBook(formData)
                }
                this.$emit('close')
            } catch (error) {
                console.error('Error saving book:', error)
            }
        },
    },
}
</script>

<style scoped>
.book-form-container {
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

.book-form {
    background: var(--white);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
.form-group textarea,
.form-group select {
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

.error-message {
    color: red;
    margin-top: 0.5rem;
}
</style>
