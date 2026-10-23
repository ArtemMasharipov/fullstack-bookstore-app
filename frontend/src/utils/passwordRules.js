/** Client checks length only; blocklist and account context belong to the server. */
export function passwordLengthIssue(value) {
    const length = [...value.normalize('NFKC')].length
    return length < 15 ? 'too_small' : length > 128 ? 'too_big' : null
}

export function passwordErrorKey(code) {
    const known = ['too_small', 'too_big', 'common', 'context', 'same_as_current', 'incorrect']
    return 'profile.passwordErrors.' + (known.includes(code) ? code : 'invalid')
}
