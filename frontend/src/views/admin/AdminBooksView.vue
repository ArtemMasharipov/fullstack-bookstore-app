<template>
    <div class="admin-books">
        <!-- Book management data table -->
        <admin-data-table
            :headers="headers"
            :items="books"
            :loading="loading"
            :total-items="totalItems"
            :page="page"
            :items-per-page="itemsPerPage"
            :sort-by="sortBy"
            :search="search"
            title="Books Management"
            @update:page="updatePage"
            @update:items-per-page="updateItemsPerPage"
            @update:sort-by="updateSortBy"
            @update:search="updateSearch"
            @reset-filters="resetFilters"
        >
            <!-- Table actions -->
            <template #actions>
                <v-btn color="primary" prepend-icon="mdi-plus" @click="openBookDialog()"> Add New Book </v-btn>
            </template>

            <!-- Price column -->
            <template #item.price="{ item }">
                <span>{{ formatPrice(item.raw ? item.raw.price : item.price) }}</span>
            </template>

            <!-- Stock status column -->
            <template #item.inStock="{ item }">
                <v-chip 
                    :color="(item.raw ? item.raw.inStock : item.inStock) ? 'success' : 'error'" 
                    size="small" 
                    class="text-uppercase"
                >
                    {{ (item.raw ? item.raw.inStock : item.inStock) ? 'In Stock' : 'Out of Stock' }}
                </v-chip>
            </template>

            <!-- Actions column -->
            <template #item.actions="{ item }">
                <div class="d-flex justify-center">
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        color="primary"
                        class="mr-1"
                        @click="openBookDialog(item.raw)"
                    >
                        <v-icon>mdi-pencil</v-icon>
                        <v-tooltip activator="parent" location="top">Edit</v-tooltip>
                    </v-btn>
                    <v-btn icon variant="text" size="small" color="error" @click="confirmDeleteBook(item.raw)">
                        <v-icon>mdi-delete</v-icon>
                        <v-tooltip activator="parent" location="top">Delete</v-tooltip>
                    </v-btn>
                </div>
            </template>
        </admin-data-table>

        <!-- Book edit/create dialog -->
        <v-dialog v-model="bookDialogOpen" max-width="800px">
            <v-card>
                <v-card-title class="text-h5 bg-primary text-white">
                    {{ isEditMode ? 'Edit Book' : 'Add New Book' }}
                </v-card-title>

                <v-card-text class="pt-4">
                    <v-form ref="bookForm" @submit.prevent="saveBook">
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="editedBook.title"
                                    label="Book Title"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[(v) => !!v || 'Title is required']"
                                ></v-text-field>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-select
                                    v-model="editedBook.author"
                                    :items="authors"
                                    item-title="name"
                                    item-value="_id"
                                    label="Author"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[(v) => !!v || 'Author is required']"
                                ></v-select>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="editedBook.category"
                                    label="Category"
                                    variant="outlined"
                                    density="comfortable"
                                ></v-text-field>
                            </v-col>

                            <v-col cols="12" md="4">
                                <v-text-field
                                    v-model.number="editedBook.publicationYear"
                                    label="Publication Year"
                                    type="number"
                                    variant="outlined"
                                    density="comfortable"
                                ></v-text-field>
                            </v-col>

                            <v-col cols="12" md="4">
                                <v-text-field
                                    v-model.number="editedBook.price"
                                    label="Price"
                                    type="number"
                                    prefix="₴"
                                    variant="outlined"
                                    density="comfortable"
                                    hint="Enter price value (e.g. 29.99)"
                                    min="0"
                                    step="0.01"
                                ></v-text-field>
                            </v-col>

                            <v-col cols="12" md="4">
                                <v-switch
                                    v-model="editedBook.inStock"
                                    label="In Stock"
                                    color="success"
                                    hide-details
                                ></v-switch>
                            </v-col>

                            <v-col cols="12">
                                <v-textarea
                                    v-model="editedBook.description"
                                    label="Description"
                                    variant="outlined"
                                    auto-grow
                                    rows="3"
                                    density="comfortable"
                                ></v-textarea>
                            </v-col>

                            <v-col cols="12">
                                <v-text-field
                                    v-model="editedBook.image"
                                    label="Cover Image URL"
                                    variant="outlined"
                                    density="comfortable"
                                    hint="URL to the book's cover image"
                                ></v-text-field>
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="bookDialogOpen = false">Cancel</v-btn>
                    <v-btn color="primary" :loading="saving" @click="saveBook"> Save </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete confirmation dialog -->
        <v-dialog v-model="deleteDialogOpen" max-width="500px">
            <v-card>
                <v-card-title class="text-h5 bg-error text-white"> Confirm Delete </v-card-title>

                <v-card-text class="pt-4">
                    <p>
                        Are you sure you want to delete <strong>{{ bookToDelete?.title }}</strong
                        >? This action cannot be undone.
                    </p>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="deleteDialogOpen = false">Cancel</v-btn>
                    <v-btn color="error" :loading="deleting" @click="deleteBook"> Delete </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </div>
</template>

<script>
import AdminDataTable from '@/components/features/admin/AdminDataTable.vue'
import { useAuthorsStore, useBooksStore } from '@/store'
import { formatPrice } from '@/utils'

export default {
    name: 'AdminBooksView',
    components: {
        AdminDataTable
    },

    data() {
        return {
            // Table state
            headers: [
                { title: 'Title', align: 'start', key: 'title' },
                { title: 'Author', align: 'start', key: 'authorName' },
                { title: 'Category', align: 'start', key: 'category' },
                { title: 'Year', align: 'start', key: 'publicationYear' },
                { title: 'Price', align: 'start', key: 'price' },
                { title: 'Status', align: 'center', key: 'inStock' },
                { title: 'Actions', align: 'center', key: 'actions', sortable: false },
            ],

            page: 1,
            itemsPerPage: 10,
            sortBy: [{ key: 'title', order: 'asc' }],
            search: '',
            totalItems: 0,

            // Form state
            bookDialogOpen: false,
            deleteDialogOpen: false,
            isEditMode: false,
            bookForm: null,
            saving: false,
            deleting: false,
            bookToDelete: null,

            // Default book data
            editedBook: {
                title: '',
                author: '',
                category: '',
                description: '',
                publicationYear: new Date().getFullYear(),
                price: 0,
                inStock: true,
                image: '',
            },
        }
    },

    computed: {
        // Books list with computed properties
        books() {
            const booksStore = useBooksStore()
            
            if (!booksStore.booksList || booksStore.booksList.length === 0) {
                return []
            }
            
            // Map books with author names
            return booksStore.booksList.map(book => {
                return {
                    ...book,
                    authorName: this.getAuthorName(book.author)
                }
            }) || []
        },

        // Store states
        loading() {
            return useBooksStore().loading
        },

        authors() {
            return useAuthorsStore().authorsList || []
        },
    },

    mounted() {
        this.loadBooks()
        this.loadAuthors()
    },

    methods: {
        // Format price value using the global formatter
        formatPrice(price) {
            return formatPrice(price);
        },
        
        // Get boolean value safely
        getBooleanValue(value) {
            return Boolean(value);
        },
        
        // Get author name from ID
        getAuthorName(authorId) {
            const author = this.authors.find((a) => a._id === authorId)
            return author ? author.name : 'Unknown Author'
        },

        // Load books data
        async loadBooks() {
            try {
                const booksStore = useBooksStore()
                
                // Fetch all books with no pagination parameters
                await booksStore.fetchBooks({})
                
                this.totalItems = booksStore.booksList?.length || 0
            } catch (error) {
                console.error('Error loading books:', error)
            }
        },

        // Load authors data
        async loadAuthors() {
            const authorsStore = useAuthorsStore()
            await authorsStore.fetchAuthors()
        },

        // Table navigation and filtering methods
        updatePage(newPage) {
            this.page = newPage
        },

        updateItemsPerPage(newValue) {
            this.itemsPerPage = newValue
            this.page = 1
        },

        updateSortBy(newValue) {
            this.sortBy = newValue
        },

        updateSearch(newValue) {
            this.search = newValue
            this.page = 1
        },

        resetFilters() {
            this.search = ''
            this.page = 1
            this.sortBy = [{ key: 'title', order: 'asc' }]
        },

        // Book dialog methods
        openBookDialog(book = null) {
            if (book) {
                this.isEditMode = true
                // Ensure we're getting the raw book data, not the display wrapper
                const bookData = book.raw || book;
                console.log('Opening edit dialog with book data:', bookData);
                this.editedBook = { ...bookData }
            } else {
                this.isEditMode = false
                this.editedBook = {
                    title: '',
                    author: '',
                    category: '',
                    description: '',
                    publicationYear: new Date().getFullYear(),
                    price: 0,
                    inStock: true,
                    image: '',
                }
            }
            this.bookDialogOpen = true
        },

        // Save book method
        async saveBook() {
            if (this.$refs.bookForm && !this.$refs.bookForm.validate().valid) {
                return
            }

            this.saving = true
            try {
                const booksStore = useBooksStore()
                
                // Create a data copy with proper type conversions
                const bookData = {
                    ...this.editedBook,
                    inStock: Boolean(this.editedBook.inStock),
                    price: parseFloat(this.editedBook.price) || 0,
                    publicationYear: parseInt(this.editedBook.publicationYear, 10) || new Date().getFullYear()
                }
                
                console.log('Saving book with strictly typed data:', bookData)
                
                if (this.isEditMode) {
                    await booksStore.updateBook({
                        id: bookData._id,
                        formData: bookData
                    })
                } else {
                    await booksStore.createBook(bookData)
                }
                
                // Close dialog and reload with fresh data
                this.bookDialogOpen = false
                await this.loadBooks()
            } catch (error) {
                console.error('Error saving book:', error)
            } finally {
                this.saving = false
            }
        },

        // Delete book methods
        confirmDeleteBook(book) {
            this.bookToDelete = book
            this.deleteDialogOpen = true
        },

        async deleteBook() {
            if (!this.bookToDelete) return

            this.deleting = true
            try {
                const booksStore = useBooksStore()
                await booksStore.deleteBook(this.bookToDelete._id)
                this.deleteDialogOpen = false
                await this.loadBooks()
            } catch (error) {
                console.error('Error deleting book:', error)
            } finally {
                this.deleting = false
            }
        }
    }
}
</script>
