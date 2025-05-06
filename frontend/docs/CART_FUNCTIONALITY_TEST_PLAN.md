# Cart Functionality Test Plan

## Test Scenarios for Cart Badge Updates

### 1. Adding Items to Cart
- **Test Case 1.1:** Add an item to cart from BookCard component
  - **Expected Result:** Cart badge should update immediately
  - **Components Involved:** `BookCard.vue`, `NavBar.vue`

- **Test Case 1.2:** Add an item to cart from BookDetails component
  - **Expected Result:** Cart badge should update immediately
  - **Components Involved:** `BookDetails.vue`, `NavBar.vue`

- **Test Case 1.3:** Add multiple items to cart in quick succession
  - **Expected Result:** Cart badge should reflect the total number of items
  - **Components Involved:** Multiple book components, `NavBar.vue`

### 2. Updating Cart Quantities

- **Test Case 2.1:** Increase item quantity in CartItem component
  - **Expected Result:** Cart badge should update to reflect new total quantity
  - **Components Involved:** `CartItem.vue`, `NavBar.vue`

- **Test Case 2.2:** Decrease item quantity in CartItem component
  - **Expected Result:** Cart badge should update to reflect new total quantity
  - **Components Involved:** `CartItem.vue`, `NavBar.vue`

### 3. Removing Items from Cart

- **Test Case 3.1:** Remove an item from cart
  - **Expected Result:** Cart badge should update immediately after removal
  - **Components Involved:** `CartItem.vue`, `NavBar.vue`

- **Test Case 3.2:** Clear entire cart
  - **Expected Result:** Cart badge should disappear or show zero
  - **Components Involved:** `CartList.vue`, `NavBar.vue`

### 4. Page Navigation Scenarios

- **Test Case 4.1:** Add item to cart and navigate to another page
  - **Expected Result:** Cart badge should persist with correct count
  - **Components Involved:** Book components, `NavBar.vue`, router

- **Test Case 4.2:** Remove item from cart and navigate to another page
  - **Expected Result:** Cart badge should persist with updated count
  - **Components Involved:** `CartItem.vue`, `NavBar.vue`, router

### 5. Authentication Scenarios

- **Test Case 5.1:** Add items to cart when logged out, then login
  - **Expected Result:** Cart badge should update to reflect server-side cart
  - **Components Involved:** `LoginForm.vue`, `NavBar.vue`, `cart.js`

- **Test Case 5.2:** Have items in cart, then logout
  - **Expected Result:** Cart badge should update to reflect guest cart
  - **Components Involved:** `NavBar.vue`, `auth.js`, `cart.js`

## Test Scenarios for Toast Notifications

### 1. Toast Display After Cart Operations

- **Test Case 1.1:** Add item to cart
  - **Expected Result:** Success toast should appear immediately
  - **Components Involved:** Book components, `toastSync.js`

- **Test Case 1.2:** Remove item from cart
  - **Expected Result:** Info toast should appear immediately
  - **Components Involved:** `CartItem.vue`, `toastSync.js`

- **Test Case 1.3:** Update item quantity
  - **Expected Result:** Info toast should appear immediately
  - **Components Involved:** `CartItem.vue`, `toastSync.js`

### 2. Toast During Navigation

- **Test Case 2.1:** Add item to cart and immediately navigate to another page
  - **Expected Result:** Toast should still appear and be visible
  - **Components Involved:** Book components, router, `toastSync.js`

- **Test Case 2.2:** Remove item and immediately navigate to another page
  - **Expected Result:** Toast should still appear and be visible
  - **Components Involved:** `CartItem.vue`, router, `toastSync.js`

### 3. Error Handling

- **Test Case 3.1:** Simulate network error when adding to cart
  - **Expected Result:** Error toast should appear immediately
  - **Components Involved:** `cart.js`, `toastSync.js`

- **Test Case 3.2:** Simulate network error when removing from cart
  - **Expected Result:** Error toast should appear immediately
  - **Components Involved:** `cart.js`, `toastSync.js`

## Test Environment Setup

### Prerequisites
- Development server running
- Sample test data (books, authors) loaded
- Both guest and authenticated user scenarios should be tested

### Testing Tools
- Vue.js DevTools for component inspection
- Browser DevTools for network monitoring
- localStorage inspection for cart data

### Test Procedure
1. Start with a clean browser session (or clear localStorage)
2. Follow each test case scenario
3. Verify the expected results
4. Document any unexpected behavior

## Edge Cases to Test

1. Slow network conditions
2. Rapid consecutive cart operations
3. Tab visibility changes (document.visibilityState)
4. Refreshing the page after cart operations
5. Using the application in multiple browser tabs simultaneously

## Regression Testing
Ensure that our changes haven't affected:
1. Other store interactions
2. General cart functionality beyond badge updates
3. Order placement process
4. User experience flow

## Documentation Updates
After completing the testing, update:
1. `CART_FUNCTIONALITY_FIXES.md` with any additional insights
2. `README.md` to reflect the improved cart functionality
