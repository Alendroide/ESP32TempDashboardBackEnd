
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfDay, endOfDay } = require('date-fns');

// GET /temperatures?page=1&limit=20
const getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const [data, total] = await Promise.all([
      prisma.temperature.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.temperature.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data,
      pagination: {
        page,
        totalPages,
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error('Error fetching temperatures:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /temperatures/today
const getToday = async (req, res) => {
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
const getByRange = async (req, res) => {
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
const getAverage = async (req, res) => {
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
const create = async (payload) => {
  const { degrees, source } = payload;
  if (typeof degrees !== 'number') return res.status(400).json({ error: 'degrees must be a number' });

  await prisma.temperature.create({
    data: {
      degrees,
      source,
    },
  });
};

// GET /temperatures/stats?from=2025-05-01&to=2025-05-10
const getStats = async (req, res) => {
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
const getHourlyAverage = async (req, res) => {
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

module.exports = {
  getAll,
  getToday,
  getByRange,
  getAverage,
  create,
  getStats,
  getHourlyAverage,
};