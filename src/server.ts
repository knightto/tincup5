import express from "express";
import path from "path";
import { tournamentRouter } from "./routes/tournaments";
import { tournamentDetailRouter } from "./routes/tournament";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/", tournamentRouter);
app.use("/", tournamentDetailRouter);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
