import { describe, expect, it } from 'vitest'
import { passwordErrorKey, passwordLengthIssue } from './passwordRules'

describe('new password length', () => {
    it.each([
        ['a'.repeat(14), 'too_small'],
        ['a'.repeat(15), null],
        ['😀'.repeat(128), null],
        ['a'.repeat(129), 'too_big'],
        ['ﬃ'.repeat(5), null],
        ['  ' + 'a'.repeat(13), null],
    ])('checks normalized code points without trimming (%s)', (value, issue) => {
        expect(passwordLengthIssue(value)).toBe(issue)
    })
    it.each(['too_small', 'too_big', 'common', 'context', 'same_as_current', 'incorrect'])(
        'maps %s to a dictionary key',
        (code) => {
            expect(passwordErrorKey(code)).toBe('profile.passwordErrors.' + code)
        }
    )
    it('maps unexpected server codes to a safe generic message', () => {
        expect(passwordErrorKey('secret from server')).toBe('profile.passwordErrors.invalid')
    })
})
