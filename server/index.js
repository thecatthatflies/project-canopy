import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const assetsDir = path.join(rootDir, "assets");
const PORT = process.env.PORT || 3000;

app.use(express.static(publicDir));
app.use("/assets", express.static(assetsDir));

app.get("/notes", (req, res) => {
  res.sendFile(path.join(publicDir, "notes.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((req, res, next) => {
  const ext = path.extname(req.path);
  if (ext && ext !== ".html") {
    return next();
  }
  res.status(404).sendFile(path.join(publicDir, "404.html"));
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`visit project canopy's website at http://localhost:${PORT}`);
  });
}

export default app;
