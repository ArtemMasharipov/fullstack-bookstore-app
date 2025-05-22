<template>
    <div class="admin-authors">
        <!-- Authors management data table -->
        <admin-data-table
            :headers="headers"
            :items="authors"
            :loading="loading"
            :total-items="totalItems"
            :page="page"
            :items-per-page="itemsPerPage"
            :sort-by="sortBy"
            :search="search"
            title="Authors Management"
            @update:page="updatePage"
            @update:items-per-page="updateItemsPerPage"
            @update:sort-by="updateSortBy"
            @update:search="updateSearch"
            @reset-filters="resetFilters"
        >
            <!-- Table actions -->
            <template #actions>
                <v-btn color="primary" prepend-icon="mdi-plus" @click="openAuthorDialog()"> Add New Author </v-btn>
            </template>

            <!-- Books count column -->
            <template #item.bookCount="{ item }">
                <v-chip size="small" color="primary" variant="tonal">
                    {{ item.raw && item.raw.books ? item.raw.books.length : 0 }}
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
                        @click="openAuthorDialog(item.raw)"
                    >
                        <v-icon>mdi-pencil</v-icon>
                        <v-tooltip activator="parent" location="top">Edit</v-tooltip>
                    </v-btn>
                    <v-btn icon variant="text" size="small" color="error" @click="confirmDeleteAuthor(item.raw)">
                        <v-icon>mdi-delete</v-icon>
                        <v-tooltip activator="parent" location="top">Delete</v-tooltip>
                    </v-btn>
                </div>
            </template>
        </admin-data-table>

        <!-- Author edit/create dialog -->
        <v-dialog v-model="authorDialogOpen" max-width="700px">
            <v-card>
                <v-card-title class="text-h5 bg-primary text-white">
                    {{ isEditMode ? 'Edit Author' : 'Add New Author' }}
                </v-card-title>

                <v-card-text class="pt-4">
                    <v-form ref="authorForm" @submit.prevent="saveAuthor">
                        <v-row>
                            <v-col cols="12">
                                <v-text-field
                                    v-model="editedAuthor.name"
                                    label="Author Name"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[(v) => !!v || 'Name is required']"
                                ></v-text-field>
                            </v-col>

                            <v-col cols="12">
                                <v-textarea
                                    v-model="editedAuthor.biography"
                                    label="Biography"
                                    variant="outlined"
                                    auto-grow
                                    rows="4"
                                    density="comfortable"
                                ></v-textarea>
                            </v-col>

                            <v-col cols="12">
                                <v-text-field
                                    v-model="editedAuthor.photoUrl"
                                    label="Photo URL"
                                    variant="outlined"
                                    density="comfortable"
                                    hint="URL to author's photo"
                                ></v-text-field>
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="authorDialogOpen = false">Cancel</v-btn>
                    <v-btn color="primary" :loading="saving" @click="saveAuthor"> Save </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete confirmation dialog -->
        <v-dialog v-model="deleteDialogOpen" max-width="500px">
            <v-card>
                <v-card-title class="text-h5 bg-error text-white"> Confirm Delete </v-card-title>

                <v-card-text class="pt-4">
                    <p>
                        Are you sure you want to delete <strong>{{ authorToDelete?.name }}</strong
                        >? This action cannot be undone.
                    </p>

                    <v-alert
                        v-if="authorToDelete?.books?.length > 0"
                        type="warning"
                        variant="tonal"
                        icon="mdi-alert"
                        class="mt-4"
                    >
                        This author has {{ authorToDelete?.books?.length }} books associated with them. Deleting this
                        author may affect these books.
                    </v-alert>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="deleteDialogOpen = false">Cancel</v-btn>
                    <v-btn color="error" :loading="deleting" @click="deleteAuthor"> Delete </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import AdminDataTable from '@/components/features/admin/AdminDataTable.vue'
import { useAuthorsStore } from '@/store'

export default {
    name: 'AdminAuthorsView',
    components: {
        AdminDataTable,
    },

    data() {
        return {
            // Table state
            headers: [
                { title: 'Name', align: 'start', key: 'name' },
                { title: 'Books', align: 'center', key: 'bookCount' },
                { title: 'Actions', align: 'center', key: 'actions', sortable: false },
            ],

            page: 1,
            itemsPerPage: 10,
            sortBy: [{ key: 'name', order: 'asc' }],
            search: '',
            totalItems: 0,

            // Form state
            authorDialogOpen: false,
            deleteDialogOpen: false,
            isEditMode: false,
            authorForm: null,
            saving: false,
            deleting: false,
            authorToDelete: null,

            // Default author data
            editedAuthor: {
                name: '',
                biography: '',
                photoUrl: '',
            },
        }
    },

    computed: {
        authors() {
            return useAuthorsStore().authorsList || []
        },

        loading() {
            return useAuthorsStore().loading
        },
    },

    mounted() {
        this.loadAuthors()
    },

    methods: {
        async loadAuthors() {
            const authorsStore = useAuthorsStore()
            await authorsStore.fetchAuthors()
            this.totalItems = authorsStore.authorsList.length || 0
        },

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
            this.sortBy = [{ key: 'name', order: 'asc' }]
        },

        openAuthorDialog(author = null) {
            if (author) {
                this.isEditMode = true
                this.editedAuthor = { ...author }
            } else {
                this.isEditMode = false
                this.editedAuthor = {
                    name: '',
                    biography: '',
                    photoUrl: '',
                }
            }
            this.authorDialogOpen = true
        },

        async saveAuthor() {
            if (this.$refs.authorForm && !this.$refs.authorForm.validate().valid) {
                return
            }

            this.saving = true
            try {
                const authorsStore = useAuthorsStore()
                if (this.isEditMode) {
                    await authorsStore.updateAuthor(this.editedAuthor)
                } else {
                    await authorsStore.createAuthor(this.editedAuthor)
                }
                this.authorDialogOpen = false
                await this.loadAuthors()
            } catch (error) {
                console.error('Error saving author:', error)
            } finally {
                this.saving = false
            }
        },

        confirmDeleteAuthor(author) {
            this.authorToDelete = author
            this.deleteDialogOpen = true
        },

        async deleteAuthor() {
            if (!this.authorToDelete) return

            this.deleting = true
            try {
                const authorsStore = useAuthorsStore()
                await authorsStore.deleteAuthor(this.authorToDelete._id)
                this.deleteDialogOpen = false
                await this.loadAuthors()
            } catch (error) {
                console.error('Error deleting author:', error)
            } finally {
                this.deleting = false
            }
        },
    },
}
</script>
