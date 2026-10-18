/**
 * Focus for a dialog that has no activator: remember() keeps the element that has focus when the dialog opens,
 * restore() gives focus back to it once the dialog is closed, if it is still on the page.
 */
export function useReturnFocus() {
    let opener = null

    return {
        remember() {
            opener = document.activeElement
        },
        restore() {
            if (opener?.isConnected) opener.focus()
            opener = null
        },
    }
}
