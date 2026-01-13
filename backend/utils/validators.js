/**
 * Validate Peruvian DNI (8 digits)
 */
function validateDNI(dni) {
    if (!dni) {
        return { valid: false, message: 'DNI es requerido' };
    }

    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(dni)) {
        return { valid: false, message: 'DNI debe tener exactamente 8 dígitos' };
    }

    return { valid: true };
}

/**
 * Validate Peruvian phone number (+51 + 9 digits)
 */
function validatePhone(phone) {
    if (!phone) {
        return { valid: false, message: 'Número de celular es requerido' };
    }

    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Check format: +51 followed by 9 digits
    const phoneRegex = /^\+51\d{9}$/;
    if (!phoneRegex.test(cleaned)) {
        return {
            valid: false,
            message: 'Número de celular debe ser +51 seguido de 9 dígitos (ej: +51987654321)'
        };
    }

    return { valid: true, cleaned };
}

/**
 * Validate name/surname
 */
function validateName(name, fieldName = 'Nombre') {
    if (!name || name.trim().length === 0) {
        return { valid: false, message: `${fieldName} es requerido` };
    }

    if (name.trim().length < 2) {
        return { valid: false, message: `${fieldName} debe tener al menos 2 caracteres` };
    }

    if (name.trim().length > 100) {
        return { valid: false, message: `${fieldName} no puede exceder 100 caracteres` };
    }

    // Only allow letters, spaces, and common Spanish characters
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(name)) {
        return { valid: false, message: `${fieldName} solo puede contener letras` };
    }

    return { valid: true };
}

/**
 * Validate raffle ID (1-100)
 */
function validateRaffleId(id) {
    const numId = parseInt(id);

    if (isNaN(numId)) {
        return { valid: false, message: 'ID de rifa inválido' };
    }

    if (numId < 1 || numId > 100) {
        return { valid: false, message: 'ID de rifa debe estar entre 1 y 100' };
    }

    return { valid: true, id: numId };
}

module.exports = {
    validateDNI,
    validatePhone,
    validateName,
    validateRaffleId
};
