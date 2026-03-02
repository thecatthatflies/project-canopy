import app from "./api/index.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`visit project canopy's website at http://localhost:${PORT}`);
});
