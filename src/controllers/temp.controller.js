
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfDay, endOfDay } = require('date-fns');

// GET /temperatures?page=1&limit=20
exports.getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const data = await prisma.temperature.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
  res.json(data);
};

// GET /temperatures/today
exports.getToday = async (req, res) => {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  const data = await prisma.temperature.findMany({
    where: {
        createdAt: {
            gte: start,
            lte: end,
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(data);
};

// GET /temperatures/range?from=2025-05-01&to=2025-05-10
exports.getByRange = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) return res.status(400).json({ error: 'from and to required' });

  const data = await prisma.temperature.findMany({
    where: {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(data);
};

// GET /temperatures/average?from=2025-05-01&to=2025-05-10
exports.getAverage = async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });

  const result = await prisma.temperature.aggregate({
    _avg: {
      degrees: true,
    },
    where: {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
  });

  res.json({ average: result._avg.degrees });
};

// POST /temperatures
exports.create = async (req, res) => {
  const { degrees, source } = req.body;
  if (typeof degrees !== 'number') return res.status(400).json({ error: 'degrees must be a number' });

  const newTemp = await prisma.temperature.create({
    data: {
      degrees,
      source,
    },
  });

  const io = req.app.get('io');
  io.emit('new-temperature', newTemp);

  res.status(201).json(newTemp);
};

// GET /temperatures/stats?from=2025-05-01&to=2025-05-10
exports.getStats = async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });

  const result = await prisma.temperature.aggregate({
    _avg: { degrees: true },
    _min: { degrees: true },
    _max: { degrees: true },
    _count: true,
    where: {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
  });

  res.json({
    average: result._avg.degrees,
    min: result._min.degrees,
    max: result._max.degrees,
    count: result._count._all,
  });
};

// GET /temperatures/hourly-average?date=2025-05-18
exports.getHourlyAverage = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' });

  const start = startOfDay(new Date(date));
  const end = endOfDay(start);

  const temps = await prisma.temperature.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const byHour = {};
  for (const t of temps) {
    const hour = t.createdAt.getHours();
    if (!byHour[hour]) byHour[hour] = [];
    byHour[hour].push(t.degrees);
  }

  const result = Object.entries(byHour).map(([hour, values]) => {
    const sum = values.reduce((acc, val) => acc + val, 0);
    return {
      hour: parseInt(hour),
      average: sum / values.length,
    };
  });

  res.json(result);
};
