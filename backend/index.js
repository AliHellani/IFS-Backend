require("dotenv").config({ path: "./secret.env" });

const express = require("express");
const pool = require("./config/db");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 3001;

const userController = require("./controllers/user_controller");
const fileController = require("./controllers/file_controller");
const authenticationToken = require("./middleware/auth");
const authorization = require("./middleware/roleAuthorization");

app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//User
app.post("/register", userController.createUser);
app.post("/login", userController.loginUser);
app.get("/verify/:token", userController.verifyUser);

app.get(
  "/findAllUsers",
  authorization("Admin", "Moderator"),
  userController.getAllUsers
);
app.get(
  "/findById/:id",
  authorization("Admin", "Moderator"),
  userController.getUserById
);
app.get(
  "/findByEmail/:email",
  authorization("Admin"),
  userController.getUserByEmail
);
app.delete(
  "/deleteUser/:id",
  authorization("Admin"),
  userController.deleteUserById
);

//File
app.post(
  "/uploadFiles",
  authenticationToken,
  authorization("Admin", "Moderator"),
  fileController.upload.array("files", 10),
  fileController.uploadFiles
);

app.get(
  "/files/:id/download",
  authenticationToken,
  fileController.downloadFile
);

app.get("/allFiles", authenticationToken, fileController.displayAllFiles);

//TEST
app.get("/test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.status(200).json({
      message: "Database connection is Active",
      result: rows[0].result,
    });
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
