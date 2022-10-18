import winston from "winston";

const LOG_LEVEL = process.env.LOG_LEVEL || "debug";

export const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log', level: 'info'}),
    ],
});