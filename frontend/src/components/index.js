/**
 * Components module index
 * Экспорт всех компонентов пользовательского интерфейса
 */

// Импорт групп компонентов
import * as common from './common';
import * as feedback from './feedback';
import * as forms from './forms';
import * as layout from './layout';

// Экспорт групп компонентов
export {
    common,
    feedback,
    forms,
    layout
};

// Экспорт всех компонентов для удобного импорта
export default {
  ...common,
  ...feedback,
  ...forms,
  ...layout
};
