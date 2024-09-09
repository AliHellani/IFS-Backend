const multer = require("multer");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const path = require("path");
const fs = require("fs");
const fileRepository = require("../repositories/file_repository");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

//Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const newFileName = `${path.basename(
      file.originalname,
      extension
    )}-${uniqueSuffix}${extension}`;
    cb(null, newFileName);
  },
});

const upload = multer({ storage: storage });

//Verify if the user is an Admin
function verifyAdmin(req, res, next) {
  if (req.user && req.user.role == "Admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access Denied. Admin Only!" });
  }
}

//Verify User Login
function verifyUser(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: "Please Log In!" });
  }
}

//Upload File
async function uploadFiles(req, res) {
  try {
    const files = req.files;
    const userId = req.user.id;

    const uploadPromises = files.map(async (file) => {
      let storedFilename = file.filename;

      //Image Resizing
      if (file.mimetype.startsWith("image/")) {
        const resizedFilename = `resized-${storedFilename}`;
        await sharp(file.path)
          .resize(800, 800, {
            fit: sharp.fit.inside,
            withoutEnlargement: true,
          })
          .toFile(path.join("uploads", resizedFilename));

        storedFilename = resizedFilename;
      }

      //Video Resizing
      if (file.mimetype.startsWith("video/")) {
        const resizedFilename = `resized-${storedFilename}`;
        const outputPath = path.join("uploads", resizedFilename);

        await new Promise((resolve, rejects) => {
          ffmpeg(file.path)
            .size("1280x720")
            .on("end", resolve)
            .on("error", rejects)
            .save(outputPath);
        });

        storedFilename = resizedFilename;
      }

      const fileData = {
        user_id: userId,
        original_filename: file.originalname,
        stored_filename: storedFilename,
        file_type: file.mimetype,
        file_size: file.size,
      };
      return fileRepository.saveFile(fileData);
    });
    const results = await Promise.all(uploadPromises);
    res.status(201).json({ message: "Files uploaded successfully", results });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading files", error: error.message });
  }
}

//Restricted for Users
async function downloadFile(req, res) {
  try {
    const fileId = req.params.id;
    const userRole = req.user.role;

    const file = await fileRepository.findFileByID(fileId);

    if (!file) {
      return res.status(404).json({ message: "File Not Found!" });
    }

    if (
      file.file_type.startsWith("video") &&
      userRole !== "Admin" &&
      userRole !== "Moderator"
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to download this video" });
    }

    if (userRole === "User") {
      return res
        .status(403)
        .json({ message: "You do not have permission to download files" });
    }

    const filePath = path.join("uploads", file.stored_filename);

    res.download(filePath, file.original_filename);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error downloading file", error: error.message });
  }
}

module.exports = {
  uploadFiles,
  downloadFile,
  upload,
};
