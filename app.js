import express from "express";
import pool from "./db.js";
import morgan from "morgan";

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;

app.post("/addSchool", async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    if (
      !name ||
      !address ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({ error: "Fill all fields." });
    }

    const query =
      "INSERT INTO schools (name,address,latitude,longitude) VALUES (?,?,?,?)";
    await pool.promise().execute(query, [name, address, latitude, longitude]);
    res.status(201).json({ message: "school added" });
  } catch (error) {
    console.error("error adding school:", error);
  }
});

// Helper function to calculate distance using Haversine Formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
};

app.get("/listSchools", async (req, res) => {
  try {
    const userLat = parseFloat(req.query.latitude);
    const userLon = parseFloat(req.query.longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are in vaild" });
    }

    const [schools] = await pool.promise().query("SELECT * FROM schools");
    const schoolsWithDistance = schools.map((school) => {
      const distance = calculateDistance(
        userLat,
        userLon,
        school.latitude,
        school.longitude
      );
      return {
        ...school,
        distance: distance.toFixed(2),
      };
    });

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(schoolsWithDistance);
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT, () => {
  console.log("Server running ");
});
