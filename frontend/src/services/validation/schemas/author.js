/**
 * Author Validation Schema
 * Схемы валидации для авторов
 */

export const authorValidationRules = {
    name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        message: 'Имя автора обязательно (2-100 символов)',
    },
    biography: {
        required: false,
        maxLength: 2000,
        message: 'Биография не должна превышать 2000 символов',
    },
    birthDate: {
        required: false,
        type: 'date',
        message: 'Некорректная дата рождения',
    },
    nationality: {
        required: false,
        maxLength: 50,
        message: 'Национальность не должна превышать 50 символов',
    },
}

export const validateAuthor = (author) => {
    const errors = {}

    // Валидация имени
    if (!author.name || author.name.trim().length < 2) {
        errors.name = authorValidationRules.name.message
    } else if (author.name.length > authorValidationRules.name.maxLength) {
        errors.name = authorValidationRules.name.message
    }

    // Валидация биографии
    if (author.biography && author.biography.length > authorValidationRules.biography.maxLength) {
        errors.biography = authorValidationRules.biography.message
    }

    // Валидация даты рождения
    if (author.birthDate && isNaN(Date.parse(author.birthDate))) {
        errors.birthDate = authorValidationRules.birthDate.message
    }

    // Валидация национальности
    if (author.nationality && author.nationality.length > authorValidationRules.nationality.maxLength) {
        errors.nationality = authorValidationRules.nationality.message
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}
