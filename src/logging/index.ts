import pino from 'pino';
import { getLoggerConfig, setupHealthCheckLogging } from './config.js';


export const logger = pino(getLoggerConfig() as pino.LoggerOptions);

export { getLoggerConfig, setupHealthCheckLogging };