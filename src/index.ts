import express, { Request, Response } from "express";
import { questionnareRouter } from "./routes/questionnare-router";
import { errorHandler } from "./middlewares/error-handler";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/questionnare", questionnareRouter);

app.use(errorHandler);

app.listen(8000, () => {
  console.log("listen 8000");
});
