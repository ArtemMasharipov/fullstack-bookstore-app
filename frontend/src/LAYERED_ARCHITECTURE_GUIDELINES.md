# Frontend Layered Architecture Guidelines

## Layer Responsibilities

### Components Layer (`/src/components/`)
- **UI Components** (`/components/ui/`):
  - Fully reusable, presentational components
  - No business logic or API calls
  - Should accept props and emit events
  - Examples: Button, Modal, Card, LoadingSpinner

- **Layout Components** (`/components/layout/`):
  - Define page structure and layout
  - Should be framework for other components
  - Examples: Header, Footer, Sidebar, PageLayout

- **Feature Components** (`/components/features/`):
  - Feature-specific components
  - Can use UI and layout components
  - Should be organized by domain/feature
  - Should not make direct API calls (use services via store)

### Views Layer (`/src/views/`)
- Route-specific pages
- Compose components from the components layer
- Connect to store for data
- Can call services for data fetching
- Should be organized by routes

### Store Layer (`/src/store/`)
- State management
- Organized by features
- Handles API calls through services
- Contains business logic for state manipulation
- No direct DOM manipulation

### Services Layer (`/src/services/`)
- Encapsulate external API communication
- Handle data transformation
- Abstract external services
- No UI or state management logic

### Utils Layer (`/src/utils/`)
- Pure utility functions
- No state, no side effects
- Reusable across the application
- Examples: date formatting, string manipulation, validation

### Router Layer (`/src/router/`)
- Defines application routes
- Handles route guards and navigation
- Links views to routes

### Assets Layer (`/src/assets/`)
- Static resources
- Images, icons, fonts
- Global styles/themes

## Development Guidelines

1. **Dependency Direction**:
   - Views → Components → UI Components
   - Views/Components → Store → Services
   - Any Layer → Utils
   - Never: UI Components → Store/Services

2. **Component Guidelines**:
   - Keep components small and focused
   - Use props for data input, events for output
   - UI components should be stateless when possible
   - Prefer composition over inheritance

3. **Service Guidelines**:
   - Use facade pattern for complex services
   - Handle errors properly
   - Add retry logic for flaky API calls
   - Return clean data models, not raw API responses

4. **Store Guidelines**:
   - Keep stores organized by feature
   - Split UI state from data state
   - Use getters for derived state
   - Document state shape with JSDoc or TypeScript

5. **Import Best Practices**:
   - Use absolute imports with @ prefix
   - Import only what you need
   - Group imports by type (vue, services, components, etc.)

## Maintainance Tasks

1. **Regular Code Reviews**:
   - Check for violations of layer boundaries
   - Ensure proper separation of concerns
   - Verify appropriate component granularity

2. **Refactoring Opportunities**:
   - Create new UI components when patterns repeat
   - Extract business logic from components to store or services
   - Create new utility functions for repeated logic

3. **Technical Debt Monitoring**:
   - Watch for components that grow too large
   - Monitor direct API calls from components
   - Look for duplicated logic across layers

By following these guidelines, the application will be easier to maintain, test, and extend.
