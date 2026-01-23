console.log('Testing imports...');
try {
    await import('./routes/authRoutes.js');
    console.log('✅ authRoutes loaded');
} catch (e) { console.error('❌ authRoutes failed', e.message); }

try {
    await import('./controllers/chatController.js');
    console.log('✅ chatController loaded');
} catch (e) { console.error('❌ chatController failed', e.message); }

try {
    await import('./services/reminderService.js');
    console.log('✅ reminderService loaded');
} catch (e) { console.error('❌ reminderService failed', e.message); }

try {
    await import('./routes/petRoutes.js');
    console.log('✅ petRoutes loaded');
} catch (e) { console.error('❌ petRoutes failed', e.message); }
// ... keep others if needed, but these are the direct server.js imports
try {
    await import('./routes/billingRoutes.js');
    console.log('✅ billingRoutes loaded');
} catch (e) { console.error('❌ billingRoutes failed', e.message); }
