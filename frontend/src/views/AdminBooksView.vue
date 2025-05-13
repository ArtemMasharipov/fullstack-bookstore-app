<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <h1 class="text-h4">Book Management</h1>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreateForm"
          >
            Add Book
          </v-btn>
        </div>

        <v-card>
          <v-card-text>
            <v-row>
              <!-- Search and filters -->
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="searchQuery"
                  label="Search books"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  class="mb-2"
                  @input="performSearch"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="categoryFilter"
                  :items="categories"
                  label="Filter by category"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-2"
                  @update:model-value="applyFilters"
                  clearable
                ></v-select>
              </v-col>

              <v-col cols="12" md="4" class="d-flex justify-end align-center">
                <p class="text-body-2 text-medium-emphasis mb-0">
                  {{ totalItems }} books found
                </p>
              </v-col>
            </v-row>

            <!-- Books table -->
            <v-table>
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Price</th>
                  <th>In Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody v-if="!booksLoading">
                <tr v-for="book in books" :key="book._id">
                  <td>
                    <v-avatar>
                      <v-img
                        :src="book.image || '/images/placeholder.png'"
                        :alt="book.title"
                        width="40"
                        height="40"
                        cover
                      ></v-img>
                    </v-avatar>
                  </td>
                  <td>{{ book.title }}</td>
                  <td>{{ book.author?.name }}</td>
                  <td>{{ book.category || '-' }}</td>
                  <td>{{ book.publicationYear }}</td>
                  <td>${{ book.price.toFixed(2) }}</td>
                  <td>
                    <v-chip
                      :color="book.inStock ? 'success' : 'error'"
                      size="small"
                      variant="outlined"
                    >
                      {{ book.inStock ? 'Yes' : 'No' }}
                    </v-chip>
                  </td>
                  <td>
                    <div class="d-flex">
                      <v-btn
                        variant="text"
                        icon="mdi-eye"
                        size="small"
                        color="primary"
                        @click="viewDetails(book._id)"
                        class="mr-1"
                      ></v-btn>
                      <v-btn
                        variant="text"
                        icon="mdi-pencil"
                        size="small"
                        color="secondary"
                        @click="openEditForm(book)"
                        class="mr-1"
                      ></v-btn>
                      <v-btn
                        variant="text"
                        icon="mdi-delete"
                        size="small"
                        color="error"
                        @click="handleDeleteClick(book)"
                      ></v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr v-for="i in 5" :key="i">
                  <td v-for="j in 8" :key="j">
                    <v-skeleton-loader type="text" width="100%"></v-skeleton-loader>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <!-- Pagination -->
            <div class="d-flex justify-center mt-4">
              <v-pagination
                v-if="totalPages > 1"
                v-model="currentPage"
                :length="totalPages"
                @update:model-value="changePage"
                rounded
              ></v-pagination>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Form Modal -->
    <book-form
      v-if="showForm"
      v-model="showForm"
      :initial-data="selectedBook"
      :loading="formSubmitting"
      @submit="handleFormSubmit"
      @close="closeForm"
      @error="handleError"
    />

    <!-- Delete confirmation modal -->
    <confirm-modal
      v-model="showDeleteDialog"
      title="Delete Book"
      :message="`Are you sure you want to delete '${bookToDelete?.title}'?`"
      confirm-button-text="Delete"
      confirm-button-color="error"
      @confirm="handleDelete"
      @cancel="cancelDeleteBook"
    />

  </v-container>
</template>

<script>
import { useBooksStore, useBooksUiStore, useUiStore, toast } from '@/stores';
import { mapActions, mapGetters } from 'pinia';
import BookForm from '@/components/books/BookForm.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import { debounce } from 'lodash';

export default {
  name: 'AdminBooksView',

  components: {
    BookForm,
    ConfirmModal
  },

  data() {
    return {
      searchQuery: '',
      categoryFilter: null,
      categories: [],
      debouncedSearch: null
    };
  },

  computed: {    ...mapGetters(useBooksStore, {
      books: 'booksList',
      booksLoading: 'booksLoading',
      pagination: 'booksPagination'
    }),
    
    ...mapGetters(useBooksUiStore, {
      showForm: 'getShowForm',
      selectedBook: 'getSelectedBook',
      bookToDelete: 'getBookToDelete',
      formSubmitting: 'getFormSubmitting',
      currentPage: 'getCurrentPage',
      showDeleteDialog: 'showDeleteDialog'
    }),

    totalItems() {
      return this.pagination?.total || 0;
    },

    totalPages() {
      return this.pagination?.pages || 1;
    }
  },

  created() {
    // Initialize stores
    const booksUiStore = useBooksUiStore();
    booksUiStore.initialize({
      itemsPerPage: 10
    });

    // Set up search with debounce
    this.debouncedSearch = debounce(() => {
      this.applyFilters();
    }, 300);

    // Load books and categories
    this.loadBooks();
    this.loadCategories();
  },

  methods: {
    ...mapActions(useBooksUiStore, [
      'openCreateForm',
      'openEditForm',
      'closeForm',
      'handleFormSubmit',
      'changePage',
      'deleteBook',
      'cancelDeleteBook',
      'loadBooks'
    ]),

    performSearch() {
      this.debouncedSearch();
    },

    applyFilters() {
      const uiStore = useUiStore();
      if (this.searchQuery) {
        uiStore.setSearchQuery('books', this.searchQuery);
      } else {
        uiStore.clearSearchQuery('books');
      }
      
      // Reset to first page when filters change
      const booksUiStore = useBooksUiStore();
      booksUiStore.$patch({ 
        currentPage: 1,
        category: this.categoryFilter
      });
      
      this.loadBooks();
    },

    async loadCategories() {
      try {
        const booksStore = useBooksStore();
        const books = await booksStore.fetchBooks({ limit: 100 });
        
        // Extract unique categories from books
        const uniqueCategories = [...new Set(
          books.books
            .filter(book => book.category)
            .map(book => book.category)
        )].sort();
        
        this.categories = uniqueCategories;
      } catch (error) {
        this.handleError('Failed to load categories');
      }
    },

    viewDetails(bookId) {
      this.$router.push(`/books/${bookId}`);
    },

    handleDeleteClick(book) {
      const booksUiStore = useBooksUiStore();
      booksUiStore.confirmDeleteBook(book);
    },

    handleDelete() {
      this.deleteBook();
      toast.success('Book deleted successfully');
    },

    handleError(message) {
      toast.error(message);
    },

    showSnackbar(message, color = 'success') {
      // Legacy method - keeping for backward compatibility
      if (color === 'error') {
        toast.error(message);
      } else if (color === 'warning') {
        toast.warning(message);
      } else if (color === 'info') {
        toast.info(message);
      } else {
        toast.success(message);
      }
    }
  }
};
</script>
