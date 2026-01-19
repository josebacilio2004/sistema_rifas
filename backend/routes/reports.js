const express = require('express');
const router = express.Router();
const db = require('../services/database');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/reports/users/csv
router.get('/users/csv', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.nombre,
                u.apellido,
                u.dni,
                u.celular,
                COUNT(r.id) as rifas_compradas,
                COALESCE(SUM(t.amount), 0) as total_gastado,
                u.created_at
            FROM users u
            LEFT JOIN raffles r ON u.id = r.purchased_by AND r.status = 'sold'
            LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'approved'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);

        const fields = ['nombre', 'apellido', 'dni', 'celular', 'rifas_compradas', 'total_gastado', 'created_at'];
        const parser = new Parser({ fields });
        const csv = parser.parse(result.rows);

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.header('Content-Disposition', 'attachment; filename=usuarios.csv');
        res.send('\uFEFF' + csv); // BOM for Excel UTF-8
    } catch (error) {
        console.error('Error generating users CSV:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/transactions/csv
router.get('/transactions/csv', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, date_from, date_to } = req.query;

        let query = `
            SELECT 
                t.id,
                TO_CHAR(t.created_at, 'DD/MM/YYYY HH24:MI') as fecha,
                u.nombre,
                u.apellido,
                u.dni,
                u.celular,
                ARRAY_TO_STRING(
                    COALESCE(
                        ARRAY_AGG(tr.raffle_id ORDER BY tr.raffle_id) FILTER (WHERE tr.raffle_id IS NOT NULL),
                        ARRAY[t.raffle_id]
                    ), ', '
                ) as rifas,
                t.amount as monto,
                t.status as estado,
                t.yape_operation_code as codigo_yape,
                t.yape_sender_name as yapero
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN transaction_raffles tr ON t.id = tr.transaction_id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            params.push(status);
            query += ` AND t.status = $${params.length}`;
        }

        if (date_from) {
            params.push(date_from);
            query += ` AND t.created_at >= $${params.length}`;
        }

        if (date_to) {
            params.push(date_to);
            query += ` AND t.created_at <= $${params.length}`;
        }

        query += ' GROUP BY t.id, u.nombre, u.apellido, u.dni, u.celular ORDER BY t.created_at DESC';

        const result = await db.query(query, params);

        const fields = ['id', 'fecha', 'nombre', 'apellido', 'dni', 'celular', 'rifas', 'monto', 'estado', 'codigo_yape', 'yapero'];
        const parser = new Parser({ fields });
        const csv = parser.parse(result.rows);

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.header('Content-Disposition', 'attachment; filename=transacciones.csv');
        res.send('\uFEFF' + csv);
    } catch (error) {
        console.error('Error generating transactions CSV:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/sales/pdf
router.get('/sales/pdf', verifyToken, isAdmin, async (req, res) => {
    try {
        const { date_from, date_to } = req.query;

        // Get sales data
        let query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sales,
                SUM(amount) as revenue
            FROM transactions
            WHERE status = 'approved'
        `;

        const params = [];

        if (date_from) {
            params.push(date_from);
            query += ` AND created_at >= $${params.length}`;
        }

        if (date_to) {
            params.push(date_to);
            query += ` AND created_at <= $${params.length}`;
        }

        query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

        const result = await db.query(query, params);

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        res.header('Content-Type', 'application/pdf');
        res.header('Content-Disposition', 'attachment; filename=reporte-ventas.pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Reporte de Ventas', { align: 'center' });
        doc.fontSize(12).text('Y si gano...?', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-PE')}`, { align: 'center' });

        if (date_from || date_to) {
            const from = date_from ? new Date(date_from).toLocaleDateString('es-PE') : 'Inicio';
            const to = date_to ? new Date(date_to).toLocaleDateString('es-PE') : 'Hoy';
            doc.text(`Período: ${from} - ${to}`, { align: 'center' });
        }

        doc.moveDown(2);

        // Summary
        const totalSales = result.rows.reduce((sum, row) => sum + parseInt(row.sales), 0);
        const totalRevenue = result.rows.reduce((sum, row) => sum + parseFloat(row.revenue), 0);

        doc.fontSize(14).text('Resumen', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total Ventas: ${totalSales}`);
        doc.text(`Ingresos Totales: S/ ${totalRevenue.toFixed(2)}`);
        doc.text(`Promedio por Venta: S/ ${(totalRevenue / totalSales || 0).toFixed(2)}`);
        doc.moveDown(2);

        // Table
        doc.fontSize(14).text('Detalle por Día', { underline: true });
        doc.moveDown();

        doc.fontSize(10);
        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 200;
        const col3X = 350;

        // Table headers
        doc.text('Fecha', col1X, tableTop);
        doc.text('Ventas', col2X, tableTop);
        doc.text('Ingresos (S/)', col3X, tableTop);

        doc.moveTo(col1X, tableTop + 15).lineTo(500, tableTop + 15).stroke();

        let y = tableTop + 25;

        result.rows.forEach(row => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            doc.text(new Date(row.date).toLocaleDateString('es-PE'), col1X, y);
            doc.text(row.sales, col2X, y);
            doc.text(`S/ ${parseFloat(row.revenue).toFixed(2)}`, col3X, y);
            y += 20;
        });

        // Footer
        doc.fontSize(8).text(
            `Página ${doc.bufferedPageRange().count}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
        );

        doc.end();
    } catch (error) {
        console.error('Error generating sales PDF:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
