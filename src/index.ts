require("dotenv").config();
import { app } from "./app";
import { connectDB } from "./database/db";
import { logger } from "./logger/logger";
import { SocketIOServer } from "./socket-io/socket-io-server";

const socketServer = new SocketIOServer(app);

const start = async () => {
  connectDB();
  const port = +process.env.PORT!;
  socketServer.listen(port, () => {
    logger.debug(`Listen ${port}`)
  });
};

start();
