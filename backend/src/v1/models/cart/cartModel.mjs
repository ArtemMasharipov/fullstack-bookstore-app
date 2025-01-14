import mongoose from 'mongoose';
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    bookId: {
        type: Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        max: 99
    },
    price: {
        type: Number,
        required: true
    }
});

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

// Только один набор индексов
cartSchema.index({ 'items._id': 1 });

// Один pre-save hook для всех операций
cartSchema.pre('save', function(next) {
    console.log('DEBUG - Pre save hook:', {
        isModified: this.isModified('items'),
        itemsCount: this.items.length,
        totalPrice: this.totalPrice
    });

    // Убедимся, что все items имеют валидные ID
    this.items.forEach(item => {
        if (!item._id) {
            item._id = new mongoose.Types.ObjectId();
        }
    });

    // Пересчитаем totalPrice
    this.totalPrice = this.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
    );

    next();
});

// Один pre-findOneAndUpdate hook
cartSchema.pre('findOneAndUpdate', function(next) {
    console.log('DEBUG - Pre findOneAndUpdate:', {
        filter: JSON.stringify(this.getFilter()),
        update: JSON.stringify(this.getUpdate())
    });
    next();
});

// Добавляем middleware для отслеживания операций с items
cartSchema.pre('findOneAndUpdate', function(next) {
    console.log('DEBUG - Cart update operation:', {
        filter: this.getFilter(),
        update: this.getUpdate(),
        options: this.getOptions()
    });
    next();
});

// Один post-findOneAndUpdate hook
cartSchema.post('findOneAndUpdate', function(doc) {
    console.log('DEBUG - Post findOneAndUpdate:', {
        success: !!doc,
        itemsCount: doc?.items?.length
    });
});

cartSchema.post('findOneAndUpdate', function(doc) {
    if (doc) {
        console.log('DEBUG - Cart after update:', {
            itemsCount: doc.items.length,
            items: doc.items.map(item => ({
                id: item._id,
                bookId: item.bookId
            }))
        });
    } else {
        console.log('DEBUG - No cart found after update');
    }
});

// Метод для удаления элемента
cartSchema.methods.removeItem = async function(itemId) {
    try {
        console.log('DEBUG - Cart.removeItem called:', {
            cartId: this._id,
            itemId,
            currentItems: this.items.length
        });

        // Проверяем ID элемента
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            throw new Error('Invalid item ID format');
        }

        // Находим индекс элемента для удаления
        const itemIndex = this.items.findIndex(item => 
            item._id.toString() === itemId.toString()
        );

        console.log('DEBUG - Found item at index:', itemIndex);

        if (itemIndex === -1) {
            throw new Error(`Item ${itemId} not found in cart`);
        }

        // Удаляем элемент
        this.items.splice(itemIndex, 1);
        
        // Сохраняем изменения
        const savedCart = await this.save();
        
        console.log('DEBUG - Cart after save:', {
            itemsRemoved: savedCart.items.length < this.items.length,
            newItemCount: savedCart.items.length
        });

        return savedCart;
    } catch (error) {
        console.error('DEBUG - removeItem error:', error);
        throw error;
    }
};

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;