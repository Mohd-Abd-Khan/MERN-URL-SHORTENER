import express from 'express';
import dotenv from "dotenv";
import mongoose from 'mongoose';
import cors from "cors";
import urlRoutes from "./routes/url.js"

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET","POST"]
}));
app.use(express.json());

app.use("/",urlRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
  console.log("connected to mongoDB");
  app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
  });
})
.catch((err)=>{
  console.log("Error connecting to MongoDB:",err);
});