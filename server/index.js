import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const assetsDir = path.join(rootDir, "assets");
const vendorDir = path.join(rootDir, "node_modules");
const pages = {
  "/": path.join(publicDir, "index.html"),
};

app.get("/", (req, res) => {
  res.sendFile(pages["/"]);
});

app.use(express.static(publicDir));
app.use("/assets", express.static(assetsDir));
app.use("/vendor", express.static(vendorDir));

app.listen(PORT, () => {
  console.log(`visit project canopy's website at http://localhost:${PORT}`);
});
