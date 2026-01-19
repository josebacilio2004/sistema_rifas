// Terms and Conditions Modal Functions

function showTerms() {
    const modal = document.getElementById('terms-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function showPrivacy() {
    const modal = document.getElementById('privacy-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function showRules() {
    const modal = document.getElementById('rules-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('legal-modal')) {
        event.target.style.display = 'none';
    }
}
