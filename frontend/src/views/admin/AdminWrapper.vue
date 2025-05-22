<template>
    <admin-layout>
        <router-view />
    </admin-layout>
</template>

<script>
import AdminLayout from '@/components/layout/admin/AdminLayout.vue'

export default {
    name: 'AdminWrapper',
    components: {
        AdminLayout,
    },
}
</script>
