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

// Serve static files from public directory
app.use(express.static(publicDir));

// Serve assets
app.use("/assets", express.static(assetsDir));

// Serve vendor files (node_modules)
app.use("/vendor", express.static(nodeModulesDir));

// Serve FontAwesome and other vendor packages with proper paths
app.use(
     "/vendor/@fortawesome",
     express.static(path.join(nodeModulesDir, "@fortawesome"))
);
app.use("/vendor/gsap", express.static(path.join(nodeModulesDir, "gsap")));
app.use("/vendor/lenis", express.static(path.join(nodeModulesDir, "lenis")));

// SPA fallback - serve index.html for all routes
app.get(/.*/, (req, res) => {
     res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
