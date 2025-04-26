const express = require("express");
const Blog = require("../models/Blog");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  const blogs = await Blog.find().populate("author", "name");
  res.json(blogs);
});

router.post("/", authenticate, authorize(["admin"]), async (req, res) => {
  const { title, content } = req.body;
  const blog = await Blog.create({ title, content, author: req.user.id });
  res.json(blog);
});

router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
