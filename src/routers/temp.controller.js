
const express = require('express');
const router = express.Router();
const controller = require('../controllers/temp.controller');

// Obtener todas las temperaturas (con paginación)
router.get('/', controller.getAll);

// Obtener todas las temperaturas del día actual
router.get('/today', controller.getToday);

// Obtener temperaturas entre dos fechas
router.get('/range', controller.getByRange);

// Obtener el promedio de temperaturas entre dos fechas
router.get('/average', controller.getAverage);

// Crear un nuevo registro de temperatura
router.post('/', controller.create);

// Obtener estadísticas (avg, min, max, count) entre fechas
router.get('/stats', controller.getStats);

// Obtener promedios por hora de un día específico
router.get('/hourly-average', controller.getHourlyAverage);

module.exports = router;