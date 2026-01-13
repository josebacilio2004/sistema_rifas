const express = require('express');
const router = express.Router();
const db = require('../services/database');
const { validateDNI, validatePhone, validateName } = require('../utils/validators');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res, next) => {
    try {
        const { nombre, apellido, dni, celular } = req.body;

        // Validate input
        const nombreValidation = validateName(nombre, 'Nombre');
        if (!nombreValidation.valid) {
            return res.status(400).json({ error: nombreValidation.message });
        }

        const apellidoValidation = validateName(apellido, 'Apellido');
        if (!apellidoValidation.valid) {
            return res.status(400).json({ error: apellidoValidation.message });
        }

        const dniValidation = validateDNI(dni);
        if (!dniValidation.valid) {
            return res.status(400).json({ error: dniValidation.message });
        }

        const phoneValidation = validatePhone(celular);
        if (!phoneValidation.valid) {
            return res.status(400).json({ error: phoneValidation.message });
        }

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE dni = $1',
            [dni]
        );

        if (existingUser.rows.length > 0) {
            // Return existing user
            return res.json({
                message: 'Usuario ya existe',
                user: {
                    id: existingUser.rows[0].id,
                    nombre,
                    apellido,
                    dni,
                    celular: phoneValidation.cleaned
                }
            });
        }

        // Create new user
        const result = await db.query(
            `INSERT INTO users (nombre, apellido, dni, celular) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, nombre, apellido, dni, celular, created_at`,
            [nombre.trim(), apellido.trim(), dni, phoneValidation.cleaned]
        );

        const user = result.rows[0];

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                dni: user.dni,
                celular: user.celular,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Error in register:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: 'El DNI ya está registrado' });
        }
        next(error);
    }
});

/**
 * GET /api/auth/user/:dni
 * Get user by DNI
 */
router.get('/user/:dni', async (req, res, next) => {
    try {
        const { dni } = req.params;

        const dniValidation = validateDNI(dni);
        if (!dniValidation.valid) {
            return res.status(400).json({ error: dniValidation.message });
        }

        const result = await db.query(
            'SELECT id, nombre, apellido, dni, celular, created_at FROM users WHERE dni = $1',
            [dni]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
