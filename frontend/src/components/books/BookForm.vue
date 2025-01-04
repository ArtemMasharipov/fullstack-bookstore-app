<template>
    <div class="book-form-container">
        <form class="book-form" enctype="multipart/form-data" @submit.prevent="handleSubmit">
            <h2>{{ formTitle }}</h2>

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
                <label for="image">Book Cover</label>

                <!-- Кнопка для загрузки файла -->
                <button 
                    v-if="!fileSelected"
                    type="button" 
                    class="btn btn-upload" 
                    @click="selectFile">
                    Выберите файл
                </button>

                <!-- Имя выбранного файла -->
                <span v-if="selectedFile">{{ selectedFile.name }}</span>

                <!-- Скрытый input -->
                <input 
                    id="image"
                    ref="fileInput"
                    type="file" 
                    accept="image/*"
                    style="display: none;"
                    @change="handleImageUpload"
                />

                <div v-if="imagePreview" class="image-preview">
                    <img :src="imagePreview" alt="Book cover preview" />
                    <button type="button" class="remove-image" @click="resetImage">
                        <span>&times;</span>
                    </button>
                </div>

                <p v-if="imageError" class="error-message">{{ imageError }}</p>
                <p v-if="imageLoading" class="loading-message">Loading preview...</p>
            </div>

            <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Saving...' : form.id ? 'Update Book' : 'Create Book' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="handleCancel">Cancel</button>
        </form>
    </div>
</template>


<script>
import { mapGetters, mapActions } from 'vuex';

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
                description: '',
                ...this.initialData,
            },
            selectedFile: null,
            imageError: null,
            imagePreview: null,
            imageLoading: false,
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
            fileSelected: false,
        };
    },

    computed: {
        ...mapGetters('authors', ['authorsList']),
        authors() {
            return this.authorsList;
        },
        formTitle() {
            return this.form.id ? 'Edit Book' : 'Create Book';
        },
    },

    created() {
        this.fetchAuthors();
    },

    beforeUnmount() {
        if (this.imagePreview) {
            URL.revokeObjectURL(this.imagePreview);
        }
    },

    methods: {
        ...mapActions('authors', ['fetchAuthors']),
        ...mapActions('books', ['createBook', 'updateBook']),

        selectFile() {
            this.fileSelected = true;
            this.$refs.fileInput.click();
        },

        handleImageUpload() {
            const file = this.$refs.fileInput.files[0]; // Берём файл через $refs
            if (!file) return;

            // Проверка типа файла
            if (!this.allowedTypes.includes(file.type)) {
                this.imageError = 'Please upload an image file (JPEG, PNG, GIF)';
                this.resetImage();
                return;
            }

            // Проверка размера файла
            if (file.size > 10485760) {
                this.imageError = 'File size should not exceed 10MB';
                this.resetImage();
                return;
            }

            this.imageError = null;
            this.imageLoading = true;
            this.selectedFile = file;
            this.createImagePreview(file);
        },

        createImagePreview(file) {
            if (this.imagePreview) {
                URL.revokeObjectURL(this.imagePreview);
            }
            this.imagePreview = URL.createObjectURL(file);
            this.imageLoading = false;
        },

        resetImage() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
            this.selectedFile = null;
            if (this.imagePreview) {
                URL.revokeObjectURL(this.imagePreview);
                this.imagePreview = null;
            }
            this.imageLoading = false;
            this.fileSelected = false;
        },

        handleCancel() {
            this.resetImage();
            this.$emit('close');
        },

        async handleSubmit() {
            try {
                const formData = new FormData();
                formData.append('title', this.form.title);
                formData.append('authorId', this.form.authorId);
                formData.append('publicationYear', this.form.publicationYear);
                formData.append('category', this.form.category);
                formData.append('description', this.form.description);

                if (this.selectedFile) {
                    formData.append('image', this.selectedFile);
                }

                if (this.form.id) {
                    await this.updateBook({ id: this.form.id, formData });
                } else {
                    await this.createBook(formData);
                }
                this.$emit('close');
            } catch (error) {
                console.error('Error saving book:', error);
            }
        },
    },
};
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
    align-items: flex-start; /* Меняем align-items */
    overflow-y: auto; /* Добавляем прокрутку */
    padding: 2rem; /* Устанавливаем отступы для контейнера */
}

.book-form {
    background: var(--white);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
    margin-top: 2rem; /* Добавляем отступ сверху */
    box-sizing: border-box;
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

.image-preview {
    position: relative;
    margin-top: 1rem;
    max-width: 200px;
}

.image-preview img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    border: 1px solid var(--gray-medium);
}

.remove-image {
    position: absolute;
    top: -10px;
    right: -10px;
    background: var(--error-color, red);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 16px;
}

.remove-image:hover {
    background: darkred;
}

.loading-message {
    color: var(--gray-dark);
    margin-top: 0.5rem;
    font-style: italic;
}
</style>
