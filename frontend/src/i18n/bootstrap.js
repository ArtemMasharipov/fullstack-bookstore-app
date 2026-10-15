const failureCopy = {
    en: { message: 'Could not load the language. Try again.', retry: 'Retry' },
    cs: { message: 'Jazyk se nepodařilo načíst. Zkuste to znovu.', retry: 'Zkusit znovu' },
}

function waitForRetry(target, locale) {
    const copy = failureCopy[locale]
    const alert = document.createElement('div')
    alert.setAttribute('role', 'alert')
    alert.lang = locale
    const message = document.createElement('p')
    message.textContent = copy.message
    const retry = document.createElement('button')
    retry.type = 'button'
    retry.textContent = copy.retry
    alert.append(message, retry)
    target.replaceChildren(alert)
    retry.focus()
    return new Promise((resolve) => {
        retry.addEventListener(
            'click',
            () => {
                retry.disabled = true
                resolve()
            },
            { once: true }
        )
    })
}

export async function startWithLocaleRetry({ locale, load, start, target }) {
    let hasAlert = false
    for (;;) {
        try {
            await load(locale)
        } catch {
            hasAlert = true
            await waitForRetry(target, locale)
            continue
        }
        if (hasAlert) target.replaceChildren()
        await start()
        return
    }
}
