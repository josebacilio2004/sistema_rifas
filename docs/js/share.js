// Social Media Sharing Functions

// Web Share API (for mobile devices)
async function shareRaffle() {
    const shareData = {
        title: '🎉 ¡Participa en Y si gano...?!',
        text: '¡Únete a nuestra rifa! Increíbles premios te esperan. 🍀',
        url: window.location.origin
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            console.log('✅ Shared successfully');
        } else {
            // Fallback: show share buttons
            showShareButtons();
        }
    } catch (error) {
        console.log('ℹ️ Share cancelled or not supported');
    }
}

// Share on WhatsApp
function shareOnWhatsApp() {
    const text = encodeURIComponent('🎉 ¡Participa en Y si gano...?! Increíbles premios te esperan. 🍀');
    const url = encodeURIComponent(window.location.origin);
    const whatsappUrl = `https://wa.me/?text=${text}%20${url}`;
    window.open(whatsappUrl, '_blank');
}

// Share on Facebook
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.origin);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
}

// Share on Twitter
function shareOnTwitter() {
    const text = encodeURIComponent('🎉 ¡Participa en Y si gano...?! Increíbles premios te esperan. 🍀');
    const url = encodeURIComponent(window.location.origin);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
}

// Show share buttons (fallback for desktop)
function showShareButtons() {
    const shareModal = document.getElementById('share-modal');
    if (shareModal) {
        shareModal.style.display = 'flex';
    }
}

// Close share modal
function closeShareModal() {
    const shareModal = document.getElementById('share-modal');
    if (shareModal) {
        shareModal.style.display = 'none';
    }
}

// Copy link to clipboard
async function copyShareLink() {
    try {
        await navigator.clipboard.writeText(window.location.origin);
        alert('✅ Enlace copiado al portapapeles');
    } catch (error) {
        console.error('Error copying link:', error);
    }
}
