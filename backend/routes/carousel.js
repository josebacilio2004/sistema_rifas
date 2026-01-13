const express = require('express');
const db = require('../services/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/carousel
 * Obtener todos los items del carrusel (público)
 */
router.get('/', async (req, res, next) => {
    try {
        const items = await db.query(
            `SELECT id, titulo, descripcion, imagen_url, orden
             FROM carousel_items
             WHERE activo = true
             ORDER BY orden ASC`
        );

        res.json(items.rows);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/carousel/all
 * Obtener todos los items incluyendo inactivos (solo admin)
 */
router.get('/all', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const items = await db.query(
            `SELECT * FROM carousel_items ORDER BY orden ASC`
        );

        res.json(items.rows);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/carousel
 * Crear nuevo item del carrusel (solo admin)
 */
router.post('/', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { titulo, descripcion, imagen_url, orden } = req.body;

        if (!titulo || !imagen_url) {
            return res.status(400).json({
                error: 'Título e imagen_url son requeridos'
            });
        }

        const result = await db.query(
            `INSERT INTO carousel_items (titulo, descripcion, imagen_url, orden)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [titulo, descripcion, imagen_url, orden || 0]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/carousel/:id
 * Actualizar item del carrusel (solo admin)
 */
router.put('/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, imagen_url, orden, activo } = req.body;

        const result = await db.query(
            `UPDATE carousel_items
             SET titulo = COALESCE($1, titulo),
                 descripcion = COALESCE($2, descripcion),
                 imagen_url = COALESCE($3, imagen_url),
                 orden = COALESCE($4, orden),
                 activo = COALESCE($5, activo)
             WHERE id = $6
             RETURNING *`,
            [titulo, descripcion, imagen_url, orden, activo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/carousel/:id
 * Eliminar item del carrusel (solo admin)
 */
router.delete('/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `DELETE FROM carousel_items WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado' });
        }

        res.json({ message: 'Item eliminado exitosamente' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
