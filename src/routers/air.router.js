const express = require('express');
const router = express.Router();
const controller = require('../controllers/air.controller');

// Obtener todos los registros de calidad del aire (con paginación)
router.get('/', controller.getAll);

// Obtener registros del día actual
router.get('/today', controller.getToday);

// Obtener registros entre dos fechas
router.get('/range', controller.getByRange);

// Obtener el promedio entre dos fechas
router.get('/average', controller.getAverage);

// Obtener estadísticas (avg, min, max, count) entre fechas
router.get('/stats', controller.getStats);

// Obtener promedio por hora de un día específico
router.get('/hourly-average', controller.getHourlyAverage);

module.exports = router;
