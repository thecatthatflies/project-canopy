import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const assetsDir = path.join(rootDir, "assets");
const nodeModulesDir = path.join(rootDir, "node_modules");
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  app.use(express.static(publicDir));

  app.use("/assets", express.static(assetsDir));

  app.use("/vendor", express.static(nodeModulesDir));

  app.use(
    "/vendor/@fortawesome",
    express.static(path.join(nodeModulesDir, "@fortawesome")),
  );
  app.use("/vendor/gsap", express.static(path.join(nodeModulesDir, "gsap")));
  app.use("/vendor/lenis", express.static(path.join(nodeModulesDir, "lenis")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  app.get("/notes", (req, res) => {
    res.sendFile(path.join(publicDir, "notes.html"));
  });

  app.use((req, res) => {
    res.status(404).sendFile(path.join(publicDir, "404.html"));
  });

  app.listen(PORT, () => {
    console.log(`visit project canopy's website at http://localhost:${PORT}`);
  });
}

export default app;
