/**
 * Dependency Injection Container
 * Реализует паттерн Service Locator для управления зависимостями
 * 
 * Принципы:
 * - Single Responsibility: только управление зависимостями
 * - Open/Closed: легко расширяется новыми сервисами
 * - Dependency Inversion: контроллеры зависят от абстракций
 */

class DIContainer {
  constructor() {
    this.services = new Map()
    this.singletons = new Map()
    this.factories = new Map()
  }

  /**
   * Регистрация сервиса как singleton
   * @param {string} name - имя сервиса
   * @param {Function} factory - фабричная функция
   */
  registerSingleton(name, factory) {
    this.factories.set(name, factory)
    this.services.set(name, 'singleton')
  }

  /**
   * Регистрация сервиса как transient (новый экземпляр каждый раз)
   * @param {string} name - имя сервиса
   * @param {Function} factory - фабричная функция
   */
  registerTransient(name, factory) {
    this.factories.set(name, factory)
    this.services.set(name, 'transient')
  }

  /**
   * Регистрация готового экземпляра
   * @param {string} name - имя сервиса
   * @param {*} instance - готовый экземпляр
   */
  registerInstance(name, instance) {
    this.singletons.set(name, instance)
    this.services.set(name, 'instance')
  }

  /**
   * Получение сервиса
   * @param {string} name - имя сервиса
   * @returns {*} экземпляр сервиса
   */
  get(name) {
    const serviceType = this.services.get(name)
    
    if (!serviceType) {
      throw new Error(`Service '${name}' is not registered`)
    }

    switch (serviceType) {
      case 'singleton':
        if (!this.singletons.has(name)) {
          const factory = this.factories.get(name)
          this.singletons.set(name, factory())
        }
        return this.singletons.get(name)

      case 'transient':
        const factory = this.factories.get(name)
        return factory()

      case 'instance':
        return this.singletons.get(name)

      default:
        throw new Error(`Unknown service type: ${serviceType}`)
    }
  }

  /**
   * Проверка регистрации сервиса
   * @param {string} name - имя сервиса
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name)
  }

  /**
   * Очистка всех сервисов (для тестов)
   */
  clear() {
    this.services.clear()
    this.singletons.clear()
    this.factories.clear()
  }

  /**
   * Получение списка зарегистрированных сервисов
   * @returns {Array<string>}
   */
  getRegisteredServices() {
    return Array.from(this.services.keys())
  }
}

// Создаем глобальный экземпляр контейнера
const container = new DIContainer()

export { DIContainer, container }
export default container
