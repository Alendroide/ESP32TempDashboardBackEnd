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

  // Obtener todas las temperaturas entre las fechas
  const allTemperatures = await prisma.temperature.findMany({
    where: {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Seleccionar 20 puntos equidistantes
  const totalTemperatures = allTemperatures.length;
  const stepTemperatures = Math.floor(totalTemperatures / 20);
  const sampledTemperatures = [];

  for (let i = 0; i < 20 && i * stepTemperatures < totalTemperatures; i++) {
    sampledTemperatures.push(allTemperatures[i * step]);
  }

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

  // Obtener todas las lecturas de calidad del aire entre las fechas
  const allAirReadings = await prisma.air.findMany({
    where: {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Seleccionar 20 puntos equidistantes
  const totalAir = allAirReadings.length;
  const stepAir = Math.floor(totalAir / 20);
  const sampledAir = [];

  for (let i = 0; i < 20 && i * stepAir < totalAir; i++) {
    sampledAir.push(allAirReadings[i * stepAir]);
  }

  res.json({
    temperature: {
        average: tempResult._avg.degrees,
        min: tempResult._min.degrees,
        max: tempResult._max.degrees,
        count: tempResult._count._all,
        samples: sampledTemperatures
    },
    air: {
        average: gasResult._avg.airQuality,
        min: gasResult._min.airQuality,
        max: gasResult._max.airQuality,
        count: gasResult._count._all,
        samples: sampledAir
    }
  });
};

module.exports = { getStats }