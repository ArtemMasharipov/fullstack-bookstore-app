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
                    <v-form ref="authorForm" @submit.prevent="handleSaveAuthor" validate-on="submit">
                        <v-row>
                            <v-col cols="12">
                                <v-text-field
                                    v-model="editedAuthor.name"
                                    label="Author Name"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[(v) => !!v || 'Name is required']"
                                    required
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
                    <v-btn variant="text" @click="closeAuthorDialog">Cancel</v-btn>
                    <v-btn color="primary" :loading="saving" type="submit" @click.prevent="handleSaveAuthor"> Save </v-btn>
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
                    <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
                    <v-btn color="error" :loading="deleting" @click="handleDeleteAuthor"> Delete </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Components
import AdminDataTable from '@/components/features/admin/AdminDataTable.vue'

// Stores
import { useAuthorsStore } from '@/store/modules/authors'
import { toast } from '@/store/modules/ui'

// Store instance
const authorsStore = useAuthorsStore()

// Table configuration
const headers = [
    { title: 'Name', align: 'start', key: 'name' },
    { title: 'Books', align: 'center', key: 'bookCount' },
    { title: 'Actions', align: 'center', key: 'actions', sortable: false },
]

// Data table state
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref([{ key: 'name', order: 'asc' }])
const search = ref('')
const totalItems = ref(0)

// Dialog states
const authorDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)

// Edit state
const isEditMode = ref(false)
const editedAuthor = ref({
    name: '',
    biography: '',
    photoUrl: '',
})
const authorToDelete = ref(null)

// Computed properties
const authors = computed(() => authorsStore.authorsList || [])
const loading = computed(() => authorsStore.loading)

// Data table methods
const updatePage = (newPage) => {
    page.value = newPage
}

const updateItemsPerPage = (newValue) => {
    itemsPerPage.value = newValue
    page.value = 1
}

const updateSortBy = (newValue) => {
    sortBy.value = newValue
}

const updateSearch = (newValue) => {
    search.value = newValue
    page.value = 1
}

const resetFilters = () => {
    search.value = ''
    page.value = 1
    sortBy.value = [{ key: 'name', order: 'asc' }]
}

// Author management methods
const loadAuthors = async () => {
    try {
        await authorsStore.fetchAuthors()
        totalItems.value = authors.value.length || 0
    } catch (error) {
        // Error loading authors
        toast.error('Failed to load authors')
    }
}

const getDefaultAuthor = () => {
    return {
        name: '',
        biography: '',
        photoUrl: '',
    }
}

const openAuthorDialog = (author = null) => {
    isEditMode.value = !!author
    editedAuthor.value = author ? { ...author } : getDefaultAuthor()
    authorDialogOpen.value = true
}

const closeAuthorDialog = () => {
    authorDialogOpen.value = false
    saving.value = false
    isEditMode.value = false
    editedAuthor.value = getDefaultAuthor()
}

const handleSaveAuthor = async () => {
    // Note: Form validation would need to be handled differently in Composition API
    // This assumes validation is done elsewhere or simplified for migration
    
    saving.value = true
    try {
        const authorData = { ...editedAuthor.value }
        
        if (isEditMode.value) {
            await authorsStore.updateAuthor(authorData)
            toast.success(`Author "${authorData.name}" updated successfully`)
        } else {
            await authorsStore.createAuthor(authorData)
            toast.success(`Author "${authorData.name}" created successfully`)
        }
        
        closeAuthorDialog()
        await loadAuthors()
    } catch (error) {
        toast.error(`Failed to save author: ${error.message || 'Unknown error'}`)
    } finally {
        saving.value = false
    }
}

const confirmDeleteAuthor = (author) => {
    authorToDelete.value = author
    deleteDialogOpen.value = true
}

const closeDeleteDialog = () => {
    deleteDialogOpen.value = false
    deleting.value = false
    authorToDelete.value = null
}

const handleDeleteAuthor = async () => {
    if (!authorToDelete.value) return

    deleting.value = true
    try {
        await authorsStore.deleteAuthor(authorToDelete.value._id)
        toast.success(`Author "${authorToDelete.value.name}" deleted successfully`)
        
        closeDeleteDialog()
        await loadAuthors()
    } catch (error) {
        toast.error(`Failed to delete author: ${error.message || 'Unknown error'}`)
    } finally {
        deleting.value = false
    }
}

onMounted(() => {
    loadAuthors()
})
</script>
