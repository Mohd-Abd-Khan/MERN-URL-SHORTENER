import express from "express";
import Url from "../models/Url.js";
import { nanoid } from "nanoid";


const router = express.Router();

router.post("/shortener",async (req,res)=>{
  try{
    const {originalUrl}=req.body;

    if(!originalUrl){
      return res.status(400).json({error: "URL is required"});
    }

    try{
      new URL(originalUrl);
    } catch{
      return res.status(400).json({error: "Invalid URL"});
    }

    let shortId;
    let exists=true;
    while(exists){
      shortId=nanoid(7);
      exists= await Url.findOne({shortId});
    }

    await Url.create({
      originalUrl,
      shortId,
    });

    const shortUrl = `${process.env.BASE_URL}/${shortId}`;
    return res.status(201).json({ shortUrl });

  }catch(err){
    console.log(err);
    res.status(500).json({error:"Server Error"});
  }
})

router.get("/:shortId",async(req,res)=>{
  try{
    const {shortId}=req.params;

    const url =await Url.findOne({shortId});
    if(!url) return res.status(404).json({error:"URL not found"});
    url.clicks+=1;
    await url.save();

    return res.redirect(url.originalUrl);

  } catch(error){
    console.log(error);
    res.status(500).json({error:"Server error"});
  }
});

export default router; 