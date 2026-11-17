import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rimonx";

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || undefined,
  });

  console.log("MongoDB connected");
}
