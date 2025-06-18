import { CartDomainService } from '../../domain/services/CartDomainService.js'

export class GetCartUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository
  }

  async execute(userId) {
    return await this.cartRepository.findByUserId(userId)
  }
}

export class AddToCartUseCase {
  constructor(cartRepository, bookRepository) {
    this.cartRepository = cartRepository
    this.bookRepository = bookRepository
  }

  async execute(userId, bookId, quantity) {

    const book = await this.bookRepository.findById(bookId)
    if (!book) {
      throw new Error('Book not found')
    }


    CartDomainService.validateCartItem(bookId, quantity, book.price)

    // Add to cart
    return await this.cartRepository.addItem(
      userId,
      bookId,
      quantity,
      book.price
    )
  }
}

export class RemoveFromCartUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository
  }

  async execute(userId, itemId) {
    return await this.cartRepository.removeItem(userId, itemId)
  }
}

export class UpdateCartItemUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository
  }

  async execute(userId, itemId, quantity) {
    if (quantity < 1 || quantity > 99) {
      throw new Error('Quantity must be between 1 and 99')
    }

    return await this.cartRepository.updateItemQuantity(
      userId,
      itemId,
      quantity
    )
  }
}

export class SyncCartUseCase {
  constructor(cartRepository, bookRepository) {
    this.cartRepository = cartRepository
    this.bookRepository = bookRepository
  }

  async execute(userId, localCartItems) {

    CartDomainService.validateCartSync(localCartItems)

    // Sync cart
    return await this.cartRepository.syncCart(userId, localCartItems)
  }
}

export class ClearCartUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository
  }

  async execute(userId) {
    return await this.cartRepository.clear(userId)
  }
}
