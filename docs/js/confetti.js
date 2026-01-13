// Confetti Effects for Raffle System

/**
 * Trigger small confetti burst for raffle selection
 */
function triggerSmallConfetti() {
    const duration = 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']
        });

        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']
        });
    }, 50);
}

/**
 * Trigger large celebration confetti for purchase completion
 */
function triggerCelebrationConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 10000,
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#A8E6CF']
    };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Confetti from left
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });

        // Confetti from right
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
    }, 250);

    // Fireworks effect
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#A8E6CF']
        });
    }, 500);
}

/**
 * Trigger confetti at specific position (for click effects)
 */
function triggerConfettiAtPosition(x, y) {
    confetti({
        particleCount: 30,
        spread: 60,
        origin: {
            x: x / window.innerWidth,
            y: y / window.innerHeight
        },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']
    });
}
