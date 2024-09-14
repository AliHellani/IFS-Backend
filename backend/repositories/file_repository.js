const pool = require("../config/db");

//Create Files
async function saveFile(fileData) {
  try {
    const connection = await pool.getConnection();
    const query = `
        INSERT INTO UserFiles(user_id, original_filename, stored_filename, file_type, file_size, upload_date)
        VALUES(?,?,?,?,?,NOW())
        `;

    const [result] = await connection.execute(query, [
      fileData.user_id,
      fileData.original_filename,
      fileData.stored_filename,
      fileData.file_type,
      fileData.file_size,
    ]);

    connection.release();
    return result;
  } catch (error) {
    console.error("Error saving file metadata:", error);
    throw error;
  }
}

//Find File By ID
async function findFileByID(fileId) {
  try {
    const connection = await pool.getConnection();

    const query = `
    SELECT * FROM UserFiles WHERE id = ?`;

    const [rows] = await connection.execute(query, [fileId]);

    connection.release();

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console.error("Error finding file by ID:", error);
    throw error;
  }
}

// Find All Files
async function findAllFiles() {
  try {
    const connection = await pool.getConnection();

    const query = `
    SELECT * FROM UserFiles ORDER BY upload_date DESC`;

    const [rows] = await connection.execute(query);

    connection.release();

    return rows;
  } catch (error) {
    console.error("Error finding all files:", error);
    throw error;
  }
}

module.exports = {
  saveFile,
  findFileByID,
  findAllFiles,
};
