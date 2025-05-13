<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <h1 class="text-h4">Author Management</h1>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreateForm"
          >
            Add Author
          </v-btn>
        </div>

        <v-card>
          <v-card-text>
            <v-row class="mb-4">
              <!-- Search -->
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="searchQuery"
                  label="Search authors"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  class="mb-2"
                  @input="performSearch"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="8" class="d-flex justify-end align-center">
                <p class="text-body-2 text-medium-emphasis mb-0">
                  {{ authors.length }} authors found
                </p>
              </v-col>
            </v-row>

            <!-- Authors table -->
            <v-table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Books Count</th>
                  <th>Biography</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody v-if="!loading">
                <tr v-for="author in authors" :key="author._id">
                  <td>{{ author.name }}</td>
                  <td>{{ author.books ? author.books.length : 0 }}</td>
                  <td>
                    <span v-if="author.biography" class="text-truncate d-inline-block" style="max-width: 400px">
                      {{ author.biography }}
                    </span>
                    <span v-else class="text-medium-emphasis">No biography</span>
                  </td>
                  <td>
                    <div class="d-flex">
                      <v-btn
                        variant="text"
                        icon="mdi-eye"
                        size="small"
                        color="primary"
                        @click="viewDetails(author._id)"
                        class="mr-1"
                      ></v-btn>
                      <v-btn
                        variant="text"
                        icon="mdi-pencil"
                        size="small"
                        color="secondary"
                        @click="openEditForm(author)"
                        class="mr-1"
                      ></v-btn>
                      <v-btn
                        variant="text"
                        icon="mdi-delete"
                        size="small"
                        color="error"
                        @click="handleDelete(author._id)"
                      ></v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr v-for="i in 5" :key="i">
                  <td v-for="j in 4" :key="j">
                    <v-skeleton-loader type="text" width="100%"></v-skeleton-loader>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Author Form Modal -->
    <author-form
      v-if="showForm"
      v-model="showForm"
      :author="selectedAuthor"
      @submit="handleFormSubmit"
      @close="closeForm"
    />

    <!-- Delete Confirmation Modal -->
    <confirm-modal
      v-model="showDeleteConfirm"
      title="Delete Author"
      :message="'Are you sure you want to delete this author? All associated books will also be deleted.'"
      confirm-button-text="Delete"
      confirm-button-color="error"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

  </v-container>
</template>

<script>
import { useAuthorsStore, useAuthorsUiStore, toast } from '@/stores';
import { mapActions, mapGetters } from 'pinia';
import AuthorForm from '@/components/authors/AuthorForm.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import { debounce } from 'lodash';

export default {
  name: 'AdminAuthorsView',

  components: {
    AuthorForm,
    ConfirmModal
  },

  data() {
    return {
      searchQuery: '',
      debouncedSearch: null
    };
  },

  computed: {
    ...mapGetters(useAuthorsStore, {
      authors: 'authorsList',
      loading: 'loading',
      error: 'error'
    }),
    
    ...mapGetters(useAuthorsUiStore, {
      showForm: 'getShowForm',
      selectedAuthor: 'getSelectedAuthor',
      showDeleteConfirm: 'getShowDeleteConfirm',
      authorToDelete: 'getAuthorToDelete'
    })
  },

  created() {
    // Set up search with debounce
    this.debouncedSearch = debounce(() => {
      this.applySearch();
    }, 300);

    // Load authors
    this.fetchAuthors();
  },

  methods: {
    ...mapActions(useAuthorsUiStore, [
      'fetchAuthors',
      'openCreateForm',
      'openEditForm',
      'closeForm',
      'handleFormSubmit',
      'handleDelete',
      'confirmDelete',
      'cancelDelete'
    ]),

    performSearch() {
      this.debouncedSearch();
    },

    applySearch() {
      // Use the authors store directly for search
      const authorsStore = useAuthorsStore();
      authorsStore.setSearchQuery(this.searchQuery || '');
      
      this.fetchAuthors();
    },

    viewDetails(authorId) {
      this.$router.push(`/authors/${authorId}`);
    }
  }
};
</script>
