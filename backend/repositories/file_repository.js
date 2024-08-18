const pool = require("../config/db");

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

module.exports = {
  saveFile,
};
