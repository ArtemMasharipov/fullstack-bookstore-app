<template>
    <div class="admin-layout">
        <admin-sidebar />
        
        <div class="admin-content">
            <admin-header />
            
            <v-main class="admin-main">
                <v-container fluid>
                    <router-view />
                </v-container>
            </v-main>
        </div>
    </div>
</template>

<script setup>
// Components
import AdminHeader from '@/components/layout/admin/AdminHeader.vue';
import AdminSidebar from '@/components/layout/admin/AdminSidebar.vue';
</script>

<style scoped>
.admin-layout {
    display: flex;
    height: 100vh;
}

.admin-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.admin-main {
    flex: 1;
    overflow-y: auto;
    background-color: #f5f5f5;
}
</style>
