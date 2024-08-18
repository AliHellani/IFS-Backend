const bcrypt = require("bcryptjs");
const validator = require("validator");
const pool = require("../config/db");
const crypto = require("crypto");

//Create User
async function saveUser(userData) {
  const { username, email, password, role } = userData;

  if (!validator.isEmail(email)) {
    throw new Error("Invalid email address");
  }

  if (!["Admin", "Moderator", "User"].includes(role)) {
    throw new Error("Invalid role");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const activationToken = crypto.randomBytes(32).toString("hex");

  try {
    const connection = await pool.getConnection();

    const query = `
    INSERT INTO Users(username, email, password, role, is_active, activation_token, created_at)
    VALUES(?,?,?,?,?,?,NOW())
    `;

    const [result] = await connection.execute(query, [
      username,
      email,
      hashedPassword,
      role,
      false,
      activationToken,
    ]);

    connection.release();

    return { id: result.insertId, activationToken };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

//Find All Users
async function findAllUsers() {
  try {
    const connection = await pool.getConnection();
    const query = `SELECT * FROM Users`;
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    console.error("Error Finding Users:", error);
    throw error;
  }
}

//Find User By ID
async function findById(userId) {
  try {
    const connection = await pool.getConnection();
    const query = `SELECT * FROM Users WHERE id =?`;
    const [rows] = await connection.execute(query, [userId]);
    connection.release();

    if (rows.length === 0) {
      throw new Error("User Not Found");
    }

    return rows[0];
  } catch (error) {
    console.error("Error finding user by ID:", error);
    throw error;
  }
}

// Find User by Email
async function findByEmail(email) {
  try {
    const connection = await pool.getConnection();
    const query = `SELECT * FROM Users WHERE email = ?`;
    const [rows] = await connection.execute(query, [email]);
    connection.release();

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    return rows[0];
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
}

//Find User By Activation token
async function findByActivationToken(token) {
  try {
    const connection = await pool.getConnection();
    const query = `SELECT * FROM Users WHERE activation_token = ?`;
    const [rows] = await connection.execute(query, [token]);

    connection.release();

    if (rows.length === 0) {
      throw new Error("Invalid or Expired Activation Token");
    }

    return rows[0];
  } catch (error) {
    console.error("Error finding user by activation token:", error);
    throw error;
  }
}

//Update User Activation Status
async function activateUser(userId) {
  try {
    const connection = await pool.getConnection();

    const query = `UPDATE Users SET is_active = 1, activation_token= NULL WHERE id = ?`;

    const [result] = await connection.execute(query, [userId]);

    connection.release();
    return result;
  } catch (error) {
    console.error("Error activating user:", error);
    throw error;
  }
}

// Delete User by ID
async function deleteUser(userId) {
  try {
    const connection = await pool.getConnection();
    const query = `DELETE FROM Users WHERE id = ?`;
    const [result] = await connection.execute(query, [userId]);
    connection.release();

    if (result.affectedRows === 0) {
      throw new Error("User not found or already deleted");
    }

    return { message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

module.exports = {
  saveUser,
  findAllUsers,
  findById,
  findByEmail,
  findByActivationToken,
  activateUser,
  deleteUser,
};
