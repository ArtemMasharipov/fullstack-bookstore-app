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

// Оставляем только необходимые hooks
cartSchema.pre('save', function(next) {
    this.totalPrice = this.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
    );
    next();
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;