const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { startOfDay, endOfDay } = require("date-fns");

// GET /air?page=1&limit=20
const getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const [data, total] = await Promise.all([
      prisma.air.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.air.count(),
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
    console.error('Error fetching air data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /air/today
const getToday = async (req, res) => {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  const data = await prisma.air.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(data);
};

// GET /air/range?from=2025-05-01&to=2025-05-10
const getByRange = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to)
    return res.status(400).json({ error: "from and to required" });

  const data = await prisma.air.findMany({
    where: {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(data);
};

// GET /air/average?from=2025-05-01&to=2025-05-10
const getAverage = async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to)
    return res.status(400).json({ error: "from and to required" });

  const result = await prisma.air.aggregate({
    _avg: {
      airQuality: true,
    },
    where: {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
  });

  res.json({ average: result._avg.airQuality });
};

// POST /air
const create = async (payload) => {
  const { airQuality, source } = payload;
  await prisma.air.create({
    data: {
      airQuality,
      source,
    },
  });
};

// GET /air/stats?from=2025-05-01&to=2025-05-10
const getStats = async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to)
    return res.status(400).json({ error: "from and to required" });

  const result = await prisma.air.aggregate({
    _avg: { airQuality: true },
    _min: { airQuality: true },
    _max: { airQuality: true },
    _count: true,
    where: {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
  });

  res.json({
    average: result._avg.airQuality,
    min: result._min.airQuality,
    max: result._max.airQuality,
    count: result._count._all,
  });
};

// GET /air/hourly-average?date=2025-05-18
const getHourlyAverage = async (req, res) => {
  const { date } = req.query;
  if (!date)
    return res.status(400).json({ error: "date required (YYYY-MM-DD)" });

  const start = startOfDay(new Date(date));
  const end = endOfDay(start);

  const data = await prisma.air.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const byHour = {};
  for (const entry of data) {
    const hour = entry.createdAt.getHours();
    if (!byHour[hour]) byHour[hour] = [];
    byHour[hour].push(entry.airQuality);
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
