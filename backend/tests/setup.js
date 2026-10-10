// Runs in every test worker before the test file is loaded.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "test-only-jwt-secret-0123456789abcdef0123456789";
