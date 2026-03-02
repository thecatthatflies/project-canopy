import express from "express";
import path from "path";

const app = express();
const PORT = 3000;
const publicDir = path.join(process.cwd(), "public");
const assetsDir = path.join(process.cwd(), "assets");
const vendorDir = path.join(process.cwd(), "node_modules");
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
