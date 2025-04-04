
require("dotenv").config();
const { Clerk } = require("@clerk/clerk-sdk-node");

const clerk = new Clerk({
  apiKey: process.env.CLERK_SECRET_KEY,
});

module.exports = clerk;

