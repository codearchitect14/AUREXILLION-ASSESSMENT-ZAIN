import { createApp } from "./app.js";
import { createDb } from "./db/index.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

const db = createDb(config.dbPath);
const app = createApp(db);

app.listen(config.port, () => {
  logger.info(`API server listening on http://localhost:${config.port}`, {
    corsOrigins: config.corsOrigins,
  });
});
