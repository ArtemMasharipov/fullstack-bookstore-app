<template>
    <div class="book-form-container">
        <form class="book-form" enctype="multipart/form-data" @submit.prevent="handleSubmit">
            <h2>{{ isEdit ? 'Update Book' : 'Create New Book' }}</h2>

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
                <label for="description">Description</label>
                <textarea id="description" v-model="form.description" rows="4"></textarea>
            </div>

            <div class="form-group">
                <label>Book Cover</label>
                <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleImageUpload" />
                <div class="file-upload-container">
                    <button
                        v-if="!fileConfig.file"
                        type="button"
                        class="btn btn-upload"
                        @click="triggerFileInput"
                    >
                        Upload Image
                    </button>
                    <div v-if="fileConfig.file" class="selected-file">
                        <span>{{ fileConfig.file.name }}</span>
                        <button type="button" class="btn btn-remove" @click="resetImage">×</button>
                    </div>
                </div>
                <div v-if="fileConfig.preview" class="image-preview">
                    <img :src="fileConfig.preview" alt="Book cover preview" />
                </div>
                <p v-if="fileConfig.error" class="error-message">{{ fileConfig.error }}</p>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="$emit('close')">
                    Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    {{ isEdit ? 'Update' : 'Create' }}
                </button>
            </div>
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
            default: false
        }
    },
    emits: ['submit', 'close'],
    data() {
        return {
            form: {
                title: '',
                authorId: '',
                publicationYear: new Date().getFullYear(),
                category: '',
                description: '',
                ...this.initialData,
            },
            fileConfig: {
                maxSize: 10 * 1024 * 1024, // 10MB
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
                file: null,
                preview: null,
                error: null
            },
            isFileDialogOpen: false // Add this property
        }
    },
    computed: {
        ...mapGetters('authors', ['authorsList']),
        ...mapGetters('books', ['booksLoading']), // добавляем геттер состояния загрузки
        authors() {
            return this.authorsList
        },
        formTitle() {
            return this.form.id ? 'Edit Book' : 'Create Book'
        },
        isLoading() {
            return this.booksLoading
        },
        isEdit() {
            return !!this.initialData._id
        }
    },
    watch: {
        initialData: {
            handler(newVal) {
                this.form = { ...newVal }
            },
            deep: true
        }
    },
    created() {
        this.fetchAuthors()
    },
    beforeUnmount() {
        this.resetImage()
    },
    methods: {
        ...mapActions('authors', ['fetchAuthors']),
        ...mapActions('books', ['createBook', 'updateBook']),

        triggerFileInput() {
            this.isFileDialogOpen = true
            this.$refs.fileInput.click()
        },

        validateFile(file) {
            if (!this.fileConfig.allowedTypes.includes(file.type)) {
                throw new Error('Please upload an image file (JPEG, PNG, GIF)')
            }
            if (file.size > this.fileConfig.maxSize) {
                throw new Error('File size should not exceed 10MB')
            }
        },

        handleImageUpload(event) {
            this.isFileDialogOpen = false
            const file = event.target.files[0]
            if (!file) return

            try {
                this.validateFile(file)
                this.fileConfig.file = file
                this.fileConfig.preview = URL.createObjectURL(file)
                this.fileConfig.error = null
            } catch (error) {
                this.fileConfig.error = error.message
                this.resetImage()
            }
        },

        resetImage() {
            if (this.fileConfig.preview) {
                URL.revokeObjectURL(this.fileConfig.preview)
            }
            this.fileConfig = {
                ...this.fileConfig,
                file: null,
                preview: null,
                error: null
            }
            this.$refs.fileInput.value = ''
        },

        handleCancel() {
            this.resetImage()
            this.$emit('close')
        },

        async handleSubmit() {
            try {
                const formData = new FormData()
                
                // Don't include _id in formData for updates
                const dataToSend = { ...this.form }
                if (this.isEdit) {
                    delete dataToSend._id // Remove _id from form data
                }

                Object.entries(dataToSend).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formData.append(key, value)
                    }
                })

                if (this.fileConfig.file) {
                    formData.append('image', this.fileConfig.file)
                }

                if (this.isEdit) {
                    await this.updateBook({ 
                        id: this.form._id,
                        formData 
                    });
                } else {
                    await this.createBook(formData);
                }

                this.$emit('submit');
                this.$emit('close');
            } catch (error) {
                console.error('Error saving book:', error)
            }
        }
    }
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
    align-items: flex-start;
    overflow-y: auto;
    padding: 2rem;
}

.book-form {
    background: var(--white);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
    margin-top: 2rem;
    box-sizing: border-box;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--gray-medium);
    border-radius: 4px;
}

.file-upload-container {
    margin-top: 0.5rem;
}

.selected-file {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background-color: #f5f5f5;
    border-radius: 4px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
}

.btn-upload {
    background-color: var(--primary-color);
    color: white;
}

.btn-remove {
    padding: 4px 8px;
    background-color: #ff4444;
    color: white;
    font-size: 18px;
    line-height: 1;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
}

.btn-secondary {
    background-color: var(--gray-medium);
    color: white;
    margin-left: 10px;
}

.btn:hover {
    opacity: 0.9;
}

.error-message {
    color: #ff4444;
    margin-top: 0.5rem;
    font-size: 0.875rem;
}

.image-preview {
    margin-top: 1rem;
    max-width: 200px;
}

.image-preview img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    border: 1px solid var(--gray-medium);
}

.form-actions {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
}
</style>
