const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at 3000...");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

///API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const userDB = await db.get(userQuery);
  if (userDB === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO user (username,name,password,gender,location)
      VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}') `;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

///API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const userDB = await db.get(userQuery);
  if (userDB === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, userDB.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

///API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  console.log(username, oldPassword, newPassword);
  const userQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const userDB = await db.get(userQuery);
  if (userDB === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(oldPassword, userDB.password);
    if (isPasswordMatch === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const changePasswordQuery = `UPDATE user SET password ='${hashedPassword}';`;
        await db.run(changePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    }
  }
});

module.exports = app;
