document
  .getElementById("loginForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        // Store the token in localStorage
        localStorage.setItem("token", result.token);

        // Decode token to get user role
        const token = result.token;
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const userRole = decodedToken.role;
        localStorage.setItem("userRole", userRole);
        console.log("userRole", userRole);
        // Redirect to the upload page
        window.location.href = "../uploadFile/upload.html";
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  });

document
  .getElementById("RegisterRedirect")
  .addEventListener("click", function () {
    window.location.href = "../index.html";
  });
