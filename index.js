const dotenv = require('dotenv');
dotenv.config();

const mqtt = require('mqtt');
const express = require("express");
const app = express();

const morgan = require("morgan");
const cors = require("cors");

const tempController = require('./src/controllers/temp.controller');
const airController = require('./src/controllers/air.controller');

app.use(morgan());
app.use(cors());
app.use(express.json());

const tempsRouter = require('./src/routers/temp.router');
const airRouter = require('./src/routers/air.router');
app.use('/temperatures',tempsRouter);
app.use('/air',airRouter);

const brokerURL = "ws://broker.hivemq.com:8000/mqtt";
const client = mqtt.connect(brokerURL);

const tempTopic = "pepe/esp32/temperatura";
const gasTopic = "pepe/esp32/aire";

client.on('connect', () => {
  console.log('✅ Conectado al broker MQTT');
  client.subscribe(tempTopic, (err) => {
    if (err) {
      console.error('❌ Error al suscribirse:', err);
    } else {
      console.log(`📡 Suscrito al tópico: ${tempTopic}`);
    }
  });
  client.subscribe(gasTopic, (err) => {
    if (err) {
      console.error('❌ Error al suscribirse:', err);
    } else {
      console.log(`📡 Suscrito al tópico: ${gasTopic}`);
    }
  });
});

client.on('message', (receivedTopic, message) => {
    const rawPayload = message.toString();
    const payload = JSON.parse(rawPayload);
    if (receivedTopic === tempTopic) tempController.create(payload);
    if (receivedTopic === gasTopic) airController.create(payload);
});

client.on('error', (err) => {
  console.error('🚨 Error en MQTT:', err);
});

client.on('close', () => {
  console.log('📴 Conexión MQTT cerrada');
});

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})