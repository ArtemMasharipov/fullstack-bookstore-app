<template>
    <div class="form-overlay">
        <form class="book-form" enctype="multipart/form-data" @submit.prevent="handleSubmit">
            <h2>{{ isEdit ? 'Update Book' : 'Create New Book' }}</h2>

            <div class="form-group">
                <label for="title">Title</label>
                <input id="title" v-model="form.title" type="text" required />
            </div>

            <div class="form-group">
                <label for="author">Author</label>
                <select id="author" v-model="form.authorId" required>
                    <option value="">Select Author</option>
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
                <label for="price">Price (грн)</label>
                <input 
                    id="price" 
                    v-model.number="form.price"
                    type="number" 
                    min="0" 
                    step="0.01"
                    required 
                />
            </div>
            <div class="form-group">
                <label>
                    <input 
                        v-model="form.inStock" 
                        type="checkbox"
                    > In Stock
                </label>
            </div>

            <div class="form-group">
                <label>Book Cover</label>
                <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleImageUpload" />
                <div class="file-upload-container">
                    <button
                        v-if="!hasImage"
                        type="button"
                        class="btn btn-upload"
                        @click="triggerFileInput"
                    >
                        {{ isEdit ? 'Change Image' : 'Upload Image' }}
                    </button>
                    <div v-if="hasImage" class="selected-file">
                        <span>{{ imageFileName }}</span>
                        <button type="button" class="btn btn-remove" @click="removeImage">×</button>
                    </div>
                </div>
                <div v-if="hasImage" class="image-preview">
                    <img :src="currentPreviewUrl" :alt="imageFileName || 'Preview'" />
                </div>
                <p v-if="fileConfig.error" class="error-message">{{ fileConfig.error }}</p>
            </div>

            <div class="form-actions">
                <button 
                    type="button" 
                    class="btn btn-secondary" 
                    :disabled="isSubmitting" 
                    @click="$emit('close')"
                >
                    <i class="fas fa-times"></i>
                    <span>Cancel</span>
                </button>
                <button 
                    type="submit" 
                    class="btn btn-primary" 
                    :disabled="isSubmitting"
                >
                    <i :class="isEdit ? 'fas fa-save' : 'fas fa-plus'"></i>
                    <span>{{ getSubmitButtonText }}</span>
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
    emits: ['submit', 'close', 'error'],
    data() {
        return {
            form: {
                title: '',
                authorId: '',
                publicationYear: new Date().getFullYear(),
                category: '',
                description: '',
                image: null,
                price: 0,
                inStock: true,
                ...this.initialData,
            },
            fileConfig: {
                maxSize: 10 * 1024 * 1024, // 10MB
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
                file: null,
                preview: null,
                error: null
            },
            currentImage: null,
            isFileDialogOpen: false, // Add this property
            isSubmitting: false
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
        },
        getSubmitButtonText() {
            if (this.isSubmitting) {
                return this.isEdit ? 'Saving...' : 'Creating...';
            }
            return this.isEdit ? 'Save Changes' : 'Create Book';
        },
        hasImage() {
            return this.fileConfig.file || this.currentImage;
        },
        imageFileName() {
            if (this.fileConfig.file) return this.fileConfig.file.name;
            if (this.currentImage) return this.currentImage.split('/').pop();
            return '';
        },
        currentPreviewUrl() {
            return this.fileConfig.preview || this.currentImage;
        }
    },
    watch: {
        initialData: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    const authorId = newVal.author?._id || newVal.authorId || newVal.author;
                    this.form = {
                        ...this.form,
                        ...newVal,
                        authorId: authorId
                    };
                    
                    if (newVal.image) {
                        this.currentImage = newVal.image;
                    }
                }
            }
        }
    },
    created() {
        this.fetchAuthors();
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

        removeCurrentImage() {
            this.currentImage = null;
            this.form.image = null;
        },

        removeImage() {
            this.resetImage();
            this.removeCurrentImage();
        },

        handleCancel() {
            this.resetImage()
            this.$emit('close')
        },

        async handleSubmit() {
            try {
                this.isSubmitting = true;
                const formData = new FormData();
                
                const dataToSend = { ...this.form };
                if (this.isEdit) {
                    delete dataToSend._id;
                }

                if (this.currentImage && !this.fileConfig.file) {
                    dataToSend.image = this.currentImage;
                }

                Object.entries(dataToSend).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formData.append(key, value);
                    }
                });

                if (this.fileConfig.file) {
                    formData.append('image', this.fileConfig.file);
                }

                if (this.isEdit) {
                    await this.updateBook({ id: this.form._id, formData });
                } else {
                    await this.createBook(formData);
                }

                this.$emit('submit');
                this.$emit('close');
            } catch (error) {
                this.$emit('error', error.message || 'Failed to save book');
            } finally {
                this.isSubmitting = false;
            }
        }
    }
}
</script>

<style scoped>
.form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow-y: auto;
    padding: 2rem;
    z-index: 1100;
}

.book-form {
    background: var(--white);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 500px;
    margin: 2rem auto;
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
    margin-bottom: 1rem;
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    font-size: 0.9rem;
}

.btn i {
    font-size: 1rem;
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
    border-radius: 4px;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
    background-color: var(--gray-light);
    color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
    background-color: var(--gray-medium);
    color: white;
}

.btn[disabled] {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.error-message {
    color: #ff4444;
    margin-top: 0.5rem;
    font-size: 0.875rem;
}

.image-preview {
    max-width: 200px;
    margin: 1rem 0;
}

.image-preview img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    border: 1px solid var(--gray-medium);
}

.form-actions {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color, #eee);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.current-image {
    position: relative;
    margin: 1rem 0;
    max-width: 200px;
}

.current-image img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    border: 1px solid var(--gray-medium);
}

.current-image .btn-remove {
    position: absolute;
    top: -10px;
    right: -10px;
    border-radius: 50%;
    padding: 4px 8px;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.btn-primary[disabled] i {
    animation: spin 1s linear infinite;
}

@media (max-width: 768px) {
    .form-overlay {
        padding: 1rem;
    }
    
    .book-form {
        margin: 1rem auto;
        padding: 1.5rem;
    }
}
</style>
