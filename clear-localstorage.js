// Quick script to clear localStorage for testing
// Run in browser console: F12 → Console → paste this

console.log('🧹 Clearing all localStorage data...');
console.log('Before:', localStorage);

localStorage.clear();

console.log('✅ localStorage cleared!');
console.log('After:', localStorage);

// Reload page
setTimeout(() => {
    console.log('🔄 Reloading page...');
    window.location.reload();
}, 1000);
