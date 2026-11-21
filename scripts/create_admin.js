require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const readline = require("readline");
const Admin = require("../src/models/Admin");

async function initDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/just_relax_spa";
  console.log(`[Connecting to MongoDB: ${uri}]`);
  await mongoose.connect(uri);
  console.log("[MongoDB Connected Successfully]");
}

async function createOrUpdateAdmin(username, password, name = "Spa Manager", role = "superadmin") {
  try {
    await initDB();
    const cleanUsername = username.trim().toLowerCase();

    let admin = await Admin.findOne({ username: cleanUsername });

    if (admin) {
      admin.password = password; // pre('save') will hash it
      admin.name = name.trim() || cleanUsername;
      admin.role = role || "superadmin";
      await admin.save();
      console.log(`\n\x1b[33m[!] Admin '${cleanUsername}' already exists. Password & details updated successfully in Database!\x1b[0m`);
    } else {
      admin = new Admin({
        username: cleanUsername,
        password,
        name: name.trim() || cleanUsername,
        role: role || "superadmin",
      });
      await admin.save();
      console.log(`\n\x1b[32m[✓] New Admin '${cleanUsername}' successfully created in Database!\x1b[0m`);
    }

    console.log("--------------------------------------------------");
    console.log(`ID       : ${admin._id}`);
    console.log(`Username : ${admin.username}`);
    console.log(`Name     : ${admin.name}`);
    console.log(`Role     : ${admin.role}`);
    console.log("--------------------------------------------------\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`\x1b[31m[Error]: ${err.message}\x1b[0m`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length >= 2) {
  const [username, password, name, role] = args;
  createOrUpdateAdmin(username, password, name, role);
} else {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n=======================================================");
  console.log("   Just Relax Spa - Admin Account Creation");
  console.log("=======================================================\n");

  rl.question("Enter Admin Username: ", (username) => {
    if (!username.trim()) {
      console.error("\x1b[31mError: Username cannot be empty.\x1b[0m");
      rl.close();
      process.exit(1);
    }

    rl.question("Enter Admin Password (min 6 chars): ", (password) => {
      if (!password.trim() || password.length < 6) {
        console.error("\x1b[31mError: Password must be at least 6 characters.\x1b[0m");
        rl.close();
        process.exit(1);
      }

      rl.question("Enter Full Name (Default: Spa Manager): ", (name) => {
        rl.question("Enter Role (superadmin/admin, Default: superadmin): ", (role) => {
          rl.close();
          createOrUpdateAdmin(
            username,
            password,
            name.trim() || "Spa Manager",
            role.trim().toLowerCase() === "admin" ? "admin" : "superadmin"
          );
        });
      });
    });
  });
}
