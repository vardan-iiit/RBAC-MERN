const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path"); // <-- ADD THIS
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// === ADD THIS for serving frontend ===
if (process.env.NODE_ENV === "production") {
  app.use(express.static("frontend/build")); // <-- adjust "frontend" if different

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
}
// === END ===

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
