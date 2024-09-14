require("dotenv").config({ path: "../secret.env" });
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const userRepository = require("../repositories/user_repository");

const ROLE_ADMIN = "Admin";
const ROLE_MODERATOR = "Moderator";
const ROLE_USER = "User";

async function createUser(req, res) {
  try {
    const userData = req.body;

    if (![ROLE_ADMIN, ROLE_MODERATOR, ROLE_USER].includes(userData.role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    const { id, activationToken } = await userRepository.saveUser(userData);

    //Generate Activation URL
    const activationUrl = `${process.env.BASE_URL}/verify/${activationToken}`;

    //Send Activation Email
    await sendVerificationEmail(userData.email, activationUrl);

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
}

async function verifyUser(req, res) {
  const token = req.params.token;

  try {
    const user = await userRepository.findByActivationToken(token);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or Expired Activation Token" });
    }

    if (user.is_active) {
      return res.json({ message: "Account already activated." });
    }

    await userRepository.activateUser(user.id);

    // Generate JWT Token
    const jwtToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    /*const loginUrl = `${process.env.BASE_URL}/login/login.html?token=${jwtToken}`;

    res.redirect(loginUrl);
    */
    res.status(200).json({
      message: "Account Verified Successfully, You Can Now LOGIN.",
      token: jwtToken,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying account", error: error.message });
  }
}

async function sendVerificationEmail(email, url) {
  const html = `
  <h2>Verify Your Account</h2>
  <p>Click <a href="${url}">here</a> to verify your account.</p>
`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: {
      name: "Fuzik Company",
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: "Account Verification",
    text: "Please verify your account by clicking the link below",
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("verification Email Sent Successfully!");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

//Login User
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return res.status(400).json({ message: "User Not Found!" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Please Activate your account" });
    }

    /*const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid Password!" });
    }*/

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );
    res.status(200).json({ message: "Login Successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
}

// Get All Users
async function getAllUsers(req, res) {
  try {
    const users = await userRepository.findAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving users", error: error.message });
  }
}

// Get User by ID
async function getUserById(req, res) {
  try {
    const userId = req.params.id;
    const user = await userRepository.findById(userId);
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving user", error: error.message });
  }
}

// Get User by Email
async function getUserByEmail(req, res) {
  try {
    const email = req.params.email;
    const user = await userRepository.findByEmail(email);
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving user", error: error.message });
  }
}

// Delete User by ID
async function deleteUserById(req, res) {
  try {
    const userId = req.params.id;
    const result = await userRepository.deleteUser(userId);
    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
}

module.exports = {
  createUser,
  loginUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  deleteUserById,
  verifyUser,
};
