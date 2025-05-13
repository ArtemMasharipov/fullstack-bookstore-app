<template>
  <div class="notification-system-test">
    <h2>Notification System Test</h2>
    <div class="test-section">
      <h3>General Notifications</h3>
      <div class="button-row">
        <button @click="showSuccessNotification" class="btn success">Success</button>
        <button @click="showErrorNotification" class="btn error">Error</button>
        <button @click="showInfoNotification" class="btn info">Info</button>
        <button @click="showWarningNotification" class="btn warning">Warning</button>
      </div>
    </div>

    <div class="test-section">
      <h3>User Store Notifications</h3>
      <div class="button-row">
        <button @click="testCreateUser" class="btn">Create User</button>
        <button @click="testUpdateUser" class="btn">Update User</button>
        <button @click="testDeleteUser" class="btn">Delete User</button>
      </div>
    </div>

    <div class="test-section">
      <h3>Author Store Notifications</h3>
      <div class="button-row">
        <button @click="testCreateAuthor" class="btn">Create Author</button>
        <button @click="testUpdateAuthor" class="btn">Update Author</button>
        <button @click="testDeleteAuthor" class="btn">Delete Author</button>
      </div>
    </div>

    <div class="test-section">
      <h3>Cart Notifications</h3>
      <div class="button-row">
        <button @click="testAddToCart" class="btn">Add to Cart</button>
        <button @click="testUpdateCart" class="btn">Update Quantity</button>
        <button @click="testRemoveFromCart" class="btn">Remove from Cart</button>
        <button @click="testClearCart" class="btn">Clear Cart</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthorsStore } from '@/stores/authors';
import { useCartStore } from '@/stores/cart';
import { toast } from '@/stores';
import { useUsersStore } from '@/stores/users';

export default {
  name: 'NotificationSystemTest',
  
  setup() {
    const usersStore = useUsersStore();
    const authorsStore = useAuthorsStore();
    const cartStore = useCartStore();
    
    return {
      toast,
      usersStore,
      authorsStore,
      cartStore
    };
  },
    methods: {
    // General notification methods
    showSuccessNotification() {
      toast.success('This is a success notification!');
    },
    
    showErrorNotification() {
      toast.error('This is an error notification!');
    },
    
    showInfoNotification() {
      toast.info('This is an info notification!');
    },
    
    showWarningNotification() {
      toast.warning('This is a warning notification!');
    },
    
    // User store methods
    async testCreateUser() {
      try {
        await this.usersStore.createUser({
          name: 'Test User',
          email: `user_${Date.now()}@example.com`,
          role: 'customer'
        });
      } catch (error) {
        console.error('Error creating test user:', error);
      }
    },
    
    async testUpdateUser() {
      try {
        // Create a user if none exists
        if (this.usersStore.items.length === 0) {
          await this.testCreateUser();
        }
        
        const userId = this.usersStore.items[0]?.id || this.usersStore.items[0]?._id;        if (userId) {
          await this.usersStore.updateUser({
            id: userId,
            userData: {
              name: `Updated User ${Date.now()}`
            }
          });
        } else {
          toast.error('No user available to update');
        }
      } catch (error) {
        console.error('Error updating test user:', error);
      }
    },
    
    async testDeleteUser() {
      try {
        // Create a user if none exists
        if (this.usersStore.items.length === 0) {
          await this.testCreateUser();
        }
        
        const user = this.usersStore.items[0];        if (user) {
          const userId = user.id || user._id;
          const userName = user.name || 'Test User';
          await this.usersStore.deleteUser(userId, userName);
        } else {
          toast.error('No user available to delete');
        }
      } catch (error) {
        console.error('Error deleting test user:', error);
      }
    },
    
    // Author store methods
    async testCreateAuthor() {
      try {
        await this.authorsStore.createAuthor({
          name: 'Test Author',
          bio: 'This is a test author for notification testing'
        });
      } catch (error) {
        console.error('Error creating test author:', error);
      }
    },
    
    async testUpdateAuthor() {
      try {
        // Create an author if none exists
        if (this.authorsStore.items.length === 0) {
          await this.testCreateAuthor();
        }
        
        const author = this.authorsStore.items[0];
        if (author) {
          const authorId = author.id || author._id;
          await this.authorsStore.updateAuthor({
            id: authorId,
            _id: authorId, // Include both for compatibility
            name: `Updated Author ${Date.now()}`
          });
        } else {
          toast.error('No author available to update');
        }
      } catch (error) {
        console.error('Error updating test author:', error);
      }
    },
    
    async testDeleteAuthor() {
      try {
        // Create an author if none exists
        if (this.authorsStore.items.length === 0) {
          await this.testCreateAuthor();
        }
        
        const author = this.authorsStore.items[0];
        if (author) {
          const authorId = author.id || author._id;
          const authorName = author.name || 'Test Author';
          await this.authorsStore.deleteAuthor(authorId, authorName);
        } else {
          toast.error('No author available to delete');
        }
      } catch (error) {
        console.error('Error deleting test author:', error);
      }
    },
    
    // Cart methods
    async testAddToCart() {
      try {
        await this.cartStore.addToCart({
          bookId: `book_${Date.now()}`,
          quantity: 1,
          price: 29.99,
          title: 'Test Book'
        });
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    },
    
    async testUpdateCart() {
      try {
        // Add an item if cart is empty
        if (this.cartStore.items.length === 0) {
          await this.testAddToCart();
        }
        
        const item = this.cartStore.items[0];
        if (item) {
          const itemId = item.id || item._id || item.bookId;
          await this.cartStore.updateQuantity({
            itemId,
            quantity: Math.floor(Math.random() * 5) + 1,
            title: 'Test Book'
          });
        } else {
          toast.error('No item in cart to update');
        }
      } catch (error) {
        console.error('Error updating cart item:', error);
      }
    },
    
    async testRemoveFromCart() {
      try {
        // Add an item if cart is empty
        if (this.cartStore.items.length === 0) {
          await this.testAddToCart();
        }
        
        const item = this.cartStore.items[0];
        if (item) {
          const itemId = item.id || item._id || item.bookId;
          await this.cartStore.removeFromCart(itemId, 'Test Book');
        } else {
          toast.error('No item in cart to remove');
        }
      } catch (error) {
        console.error('Error removing cart item:', error);
      }
    },
    
    async testClearCart() {
      try {
        // Add an item if cart is empty
        if (this.cartStore.items.length === 0) {
          await this.testAddToCart();
        }
        
        await this.cartStore.clearCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  }
};
</script>

<style scoped>
.notification-system-test {
  padding: 20px;
  background-color: #f7f7f7;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
  max-width: 800px;
}

.test-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fff;
}

h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

h3 {
  font-size: 18px;
  color: #555;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #3a5cd7;
}

.btn.success {
  background-color: #28a745;
}

.btn.success:hover {
  background-color: #218838;
}

.btn.error {
  background-color: #dc3545;
}

.btn.error:hover {
  background-color: #c82333;
}

.btn.warning {
  background-color: #ffc107;
  color: #212529;
}

.btn.warning:hover {
  background-color: #e0a800;
}

.btn.info {
  background-color: #17a2b8;
}

.btn.info:hover {
  background-color: #138496;
}
</style>
