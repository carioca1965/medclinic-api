import "reflect-metadata";
import express, { Application } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./database/data-source";
import { routes } from "./routes";
import { errorMiddleware } from "./middlewares/errorMiddleware";

dotenv.config();

const app: Application = express();
app.use(express.json());
app.use(routes);
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("Conexão com o PostgreSQL estabelecida com sucesso.");
    app.listen(PORT, () => {
      console.log(`Servidor MedClinic API rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao conectar com o banco de dados:", error);
  });
