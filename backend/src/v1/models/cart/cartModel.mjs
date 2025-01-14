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
        unique: true // Это единственный индекс, который нам нужен
    },
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

// Удаляем лишний индекс items._id
// Оставляем только hooks
cartSchema.pre('save', function(next) {
    // Пересчет totalPrice
    this.totalPrice = this.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
    );
    next();
});

// Один post-save hook для логирования
cartSchema.post('save', function(doc) {
    console.log('Cart saved:', {
        itemsCount: doc.items.length,
        totalPrice: doc.totalPrice
    });
});

// Один pre-findOneAndUpdate hook
cartSchema.pre('findOneAndUpdate', function(next) {
    console.log('DEBUG - Pre findOneAndUpdate:', {
        filter: JSON.stringify(this.getFilter()),
        update: JSON.stringify(this.getUpdate())
    });
    next();
});

// Один post-findOneAndUpdate hook
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

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;