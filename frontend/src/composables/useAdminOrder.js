import { onScopeDispose, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { orderApi } from '@/services/api/orderApi'
import { useNotifications } from '@/composables/useNotifications'
import { resolveErrorKey } from '@/utils/errorResolver'

/** Local order snapshot; only the current id's newest read may enable actions. */
export function useAdminOrder() {
    const route = useRoute(),
        router = useRouter()
    const order = ref(null),
        loading = ref(false),
        error = ref(null),
        mutating = ref(false),
        actionError = ref(null)
    const { showSuccess } = useNotifications()
    let alive = true,
        leavingTo = null,
        generation = 0,
        request = 0,
        writing = false
    const active = () => alive && !leavingTo && route.name === 'AdminOrderDetails'
    onBeforeRouteLeave((to) => {
        leavingTo = to
        request++
    })
    function resume(to) {
        if (alive && leavingTo === to && route.name === 'AdminOrderDetails') {
            leavingTo = null
            mutating.value = writing
            reload()
        }
    }
    const stopAfter = router.afterEach((to) => resume(to))
    const stopError = router.onError((_error, to) => resume(to))
    onScopeDispose(() => {
        alive = false
        generation++
        request++
        stopAfter()
        stopError()
    })
    async function reload() {
        if (!active()) return
        const id = route.params.id,
            current = ++request
        const latest = () => active() && current === request && route.params.id === id
        loading.value = true
        error.value = null
        try {
            const result = await orderApi.get(id)
            if (latest()) order.value = result
        } catch (failure) {
            if (latest()) error.value = failure
        } finally {
            if (latest()) loading.value = false
        }
    }
    watch(
        () => route.params.id,
        () => {
            generation++
            request++
            order.value = null
            error.value = null
            actionError.value = null
            mutating.value = false
            writing = false
            reload()
        },
        { immediate: true }
    )
    async function transition({ axis, to, expectedState }) {
        if (
            !active() ||
            loading.value ||
            error.value ||
            mutating.value ||
            !order.value?.allowedTransitions?.some((action) => action.axis === axis && action.to === to)
        )
            return false
        const id = route.params.id,
            current = generation
        const confirmedState = expectedState ?? { status: order.value.status, paymentStatus: order.value.paymentStatus }
        const latest = () => active() && current === generation && route.params.id === id
        mutating.value = true
        writing = true
        actionError.value = null
        try {
            if (axis === 'payment') await orderApi.adminSetPayment(id, to, confirmedState)
            else await orderApi.adminSetStatus(id, to, confirmedState)
            if (!latest()) return false
            showSuccess(undefined, { messageKey: 'admin.orderDetails.updated' })
            await reload()
            return true
        } catch (failure) {
            if (latest()) {
                actionError.value = failure
                if (['errors.CONFLICT', 'errors.INVALID_TRANSITION'].includes(resolveErrorKey(failure))) await reload()
            }
            return false
        } finally {
            if (current === generation) {
                writing = false
                if (active()) mutating.value = false
            }
        }
    }
    return { order, loading, error, mutating, actionError, reload, transition }
}
