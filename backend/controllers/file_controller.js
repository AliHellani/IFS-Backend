const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const fileRepository = require("../repositories/file_repository");

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

//Upload File
async function uploadFiles(req, res) {
  try {
    const files = req.files;
    const userId = req.user.id;

    const uploadPromises = files.map(async (file) => {
      let storedFilename = file.filename;

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

module.exports = {
  uploadFiles,
  upload,
};
