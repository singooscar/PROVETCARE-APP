// ============================================================================
// Security Test Script for Registration Endpoint
// Run with: node test-registration.js
// ============================================================================

const testCases = [
    {
        name: "✅ Test 1: Valid Registration",
        data: {
            name: "Test User",
            email: "test.user@example.com",
            password: "SecureP@ss123",
            phone: "+51987654321"
        },
        expectedStatus: 201,
        description: "Should successfully register with strong password"
    },
    {
        name: "❌ Test 2: Weak Password (No Uppercase)",
        data: {
            name: "Weak User",
            email: "weak1@example.com",
            password: "securepass1!",
            phone: "+51987654321"
        },
        expectedStatus: 400,
        description: "Should reject password without uppercase letter"
    },
    {
        name: "❌ Test 3: Weak Password (No Special Char)",
        data: {
            name: "Weak User 2",
            email: "weak2@example.com",
            password: "SecurePass123",
            phone: "+51987654321"
        },
        expectedStatus: 400,
        description: "Should reject password without special character"
    },
    {
        name: "❌ Test 4: Too Short Password",
        data: {
            name: "Short User",
            email: "short@example.com",
            password: "Pass1!",
            phone: "+51987654321"
        },
        expectedStatus: 400,
        description: "Should reject password less than 8 characters"
    },
    {
        name: "❌ Test 5: Invalid Email",
        data: {
            name: "Invalid Email User",
            email: "not-an-email",
            password: "SecureP@ss123",
            phone: "+51987654321"
        },
        expectedStatus: 400,
        description: "Should reject invalid email format"
    },
    {
        name: "❌ Test 6: XSS Attempt in Name",
        data: {
            name: "<script>alert('XSS')</script>",
            email: "xss@example.com",
            password: "SecureP@ss123",
            phone: "+51987654321"
        },
        expectedStatus: 400,
        description: "Should reject name with script tags"
    },
    {
        name: "⚠️ Test 7: Duplicate Email (User Enumeration Test)",
        data: {
            name: "Duplicate User",
            email: "test.user@example.com", // Same as Test 1
            password: "SecureP@ss123",
            phone: "+51987654321"
        },
        expectedStatus: 400,
        description: "Should return GENERIC error message (not 'email already exists')"
    }
];

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║     SECURITY TEST SUITE - Registration Endpoint              ║");
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

console.log("📋 MANUAL TEST INSTRUCTIONS:\n");
console.log("Use Postman, Thunder Client, or curl to test the following cases:\n");

testCases.forEach((test, index) => {
    console.log(`\n${test.name}`);
    console.log("━".repeat(65));
    console.log(`Description: ${test.description}`);
    console.log(`Expected Status: ${test.expectedStatus}`);
    console.log(`\nPOST http://localhost:5000/api/auth/register`);
    console.log(`Content-Type: application/json\n`);
    console.log("Body:");
    console.log(JSON.stringify(test.data, null, 2));

    if (test.name.includes("Enumeration")) {
        console.log("\n⚠️  SECURITY CHECK:");
        console.log("   Verify the error message is GENERIC:");
        console.log('   ✅ GOOD: "No se pudo completar el registro. Por favor, verifica tus datos."');
        console.log('   ❌ BAD:  "El email ya está registrado"');
    }
});

console.log("\n\n╔═══════════════════════════════════════════════════════════════╗");
console.log("║     DATABASE VERIFICATION                                     ║");
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

console.log("After Test 1 (successful registration), verify in PostgreSQL:\n");
console.log("psql -U postgres -d provetcare_db");
console.log("SELECT email, password FROM users WHERE email='test.user@example.com';\n");
console.log("✅ Password should start with: $2b$12$ (Bcrypt cost factor 12)");
console.log("❌ Password should NOT be plaintext\n");
