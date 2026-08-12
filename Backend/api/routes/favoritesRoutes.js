const express = require("express");
const router = express.Router();
const { list, add, remove } = require("../controllers/favorites");
const verifyJWT = require("../middlewares/authMiddleware");

router.get("/", verifyJWT, list);
router.post("/:hostUid", verifyJWT, add);
router.delete("/:hostUid", verifyJWT, remove);

module.exports = router;
