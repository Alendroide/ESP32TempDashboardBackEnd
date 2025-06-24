const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getStats = async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to)
    return res.status(400).json({ error: "from and to required" });

  const tempResult = await prisma.temperature.aggregate({
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

  const gasResult = await prisma.air.aggregate({
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
    temperature: {
        average: tempResult._avg.degrees,
        min: tempResult._min.degrees,
        max: tempResult._max.degrees,
        count: tempResult._count._all,
    },
    air: {
        average: gasResult._avg.airQuality,
        min: gasResult._min.airQuality,
        max: gasResult._max.airQuality,
        count: gasResult._count._all,
    }
  });
};

module.exports = { getStats }