function isTokenExpired(token) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

document
  .getElementById("uploadForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    // Check if token is expired
    if (!token || isTokenExpired(token)) {
      alert("Your session has expired. Please log in again.");
      window.location.href = "../login/login.html";
      return;
    }

    const fileInput = document.getElementById("fileInput").files;
    const formData = new FormData();

    for (let i = 0; i < fileInput.length; i++) {
      formData.append("files", fileInput[i]);
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/uploadFiles", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        alert("Unauthorized: You do not have the necessary permissions.");
      } else if (response.status === 403) {
        alert("Forbidden: You are not allowed to upload files.");
      } else {
        const result = await response.json();
        alert(result.message);
        displayUploadedFiles(result.results);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while uploading the file.");
    }
  });

function displayUploadedFiles(files) {
  const divFile = document.getElementById("uploadedFiles");
  divFile.innerHTML = "";

  const userRole = localStorage.getItem("userRole");

  files.forEach((file) => {
    const fileElement = document.createElement("div");

    if (file.file_type.startsWith("image/")) {
      // Display Image
      const img = document.createElement("img");
      img.src = `/uploads/${file.stored_filename}`;
      img.alt = file.original_filename;
      img.style.maxWidth = "200px";
      fileElement.appendChild(img);

      if (userRole === "User") {
        img.addEventListener("contextmenu", (e) => e.preventDefault());
      }
    } else if (file.file_type.startsWith("video/")) {
      // Display Video
      const video = document.createElement("video");
      video.src = `/uploads/${file.stored_filename}`;
      video.style.maxWidth = "400px";
      fileElement.appendChild(video);

      if (userRole === "User") {
        video.addEventListener("contextmenu", (e) => e.preventDefault());

        // Remove default controls
        video.controls = false;

        // Add custom play button
        const playButton = document.createElement("button");
        playButton.textContent = "Play";
        playButton.addEventListener("click", () => video.play());
        fileElement.appendChild(playButton);

        // Add custom pause button
        const stopButton = document.createElement("button");
        stopButton.textContent = "Pause";
        stopButton.addEventListener("click", () => {
          video.pause();
        });
        fileElement.appendChild(stopButton);
      }
    } else if (file.file_type === "application/pdf") {
      // Display PDF with a download link
      const pdfViewer = document.createElement("iframe");
      pdfViewer.src = `/uploads/${file.stored_filename}`;
      pdfViewer.style.maxWidth = "600px";
      pdfViewer.style.maxHeight = "800px";
      fileElement.appendChild(pdfViewer);

      if (userRole === "User") {
        pdfViewer.addEventListener("contextmenu", (e) => e.preventDefault());
      }
    }

    divFile.appendChild(fileElement);
  });

  // Disable right-click on the entire document for users with the role "User"
  if (userRole === "User") {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}

document
  .getElementById("fetchFilesButton")
  .addEventListener("click", async () => {
    const token = localStorage.getItem("token");

    // Check if token is expired
    if (!token || isTokenExpired(token)) {
      alert("Your session has expired. Please log in again.");
      // Redirect to login page
      window.location.href = "../login/login.html";
      return;
    }

    try {
      const response = await fetch("/allFiles", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("Unauthorized: You do not have the necessary permissions.");
      } else if (response.status === 403) {
        alert("Forbidden: You are not allowed to view these files.");
      } else {
        const result = await response.json();
        console.log("Fetched files:", result);
        if (Array.isArray(result.results)) {
          displayUploadedFiles(result.results);
        } else {
          console.error("Expected an array of files but got:", result);
          alert("Failed to fetch files. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching files.");
    }
  });
