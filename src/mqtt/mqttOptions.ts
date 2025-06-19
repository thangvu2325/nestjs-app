import { MqttProtocol } from 'mqtt/*';
import { MqttModuleOptions } from './mqtt.interface';

export const mqttOptions: MqttModuleOptions = {
  hostname: process.env.MQTT_HOSTNAME,
  port: Number(process.env.MQTT_PORT) || 8884,
  protocol: process.env.MQTT_PROTOCOL as MqttProtocol,
  path: '/mqtt', 
  keepalive: 60,
  reconnectPeriod: 5000,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  protocolVersion: 5,
  clean: true,
};