require("dotenv").config({ path: "./secret.env" });

const express = require("express");
const pool = require("./config/db");
const app = express();
const PORT = process.env.PORT || 3001;

const userController = require("./controllers/user_controller");
const fileController = require("./controllers/file_controller");
const authenticationToken = require("./middleware/auth");
const authorization = require("./middleware/roleAuthorization");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.post(
  "/uploadFiles",
  authenticationToken,
  authorization("Admin", "Moderator", "User"),
  fileController.upload.array("files", 10),
  fileController.uploadFiles
);

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
