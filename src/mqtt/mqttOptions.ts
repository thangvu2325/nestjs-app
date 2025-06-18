import { MqttProtocol } from 'mqtt/*';
import { MqttModuleOptions } from './mqtt.interface';

export const mqttOptions: MqttModuleOptions = {
  hostname: process.env.MQTT_HOSTNAME,
  port: Number(process.env.MQTT_PORT),
  protocol: process.env.MQTT_PROTOCOL as MqttProtocol || "mqtts", // Explicitly specify TLS
  keepalive: 60, // Reduced to a standard value (in seconds)
  reconnectPeriod: 5000, // Increased to avoid aggressive reconnections (in ms)
  username: process.env.MQTT_USERNAME || 'admin2', // Use environment variable
  password: process.env.MQTT_PASSWORD || 'Thang123456', // Use environment variable
  protocolVersion: 5, // MQTT 5.0, assuming broker support
  clean: true, // Clean session, adjust if persistent session is needed
};
