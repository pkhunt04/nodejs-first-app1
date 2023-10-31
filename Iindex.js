import exp from "constants";
import  express  from "express";
//const express = require("express")
import  path  from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"


mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName:"backend",
}).then(()=>console.log("database connect"))
.catch((e)=>console.log(e));

const userSchema= new mongoose.Schema({
    name:String,
    email:String,
    password:String,
});

const User = mongoose.model("message",userSchema)

const app=express();

// const users=[];

app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());

app.set("view engine","ejs");

const isAuthenticated = async (req,resp,next)=>{
    const {token} = req.cookies;
    if(token){

       const decoded = jwt.verify(token,'dmhdljldl');

       console.log(decoded)

       req.user = await User.findById(decoded._id)

        next();
    }
    else{
        resp.redirect("/login")
    }
}

app.get("/",isAuthenticated,(req,resp)=>{

  resp.render("logout",{name:req.user.name});
})

app.get("/login",(req,resp)=>{
    resp.render("login");
})


app.post("/login",async (req,resp)=>{

    const {email,password} = req.body;

    let user = await User.findOne({email});

    if(!user) return resp.redirect("/register")
    

    const isMatch = await bcrypt.compare(password,user.password) ;

    if(!isMatch) return resp.render("login",{ email , message:"Incorrect password"});

    user = await User.create({
        name,
        email,
        password,
    });

    const token = jwt.sign({ _id: user._id }, 'dmhdljldl');
    
    console.log(token);

    resp.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000),
    });
    resp.redirect("/");
})



app.get("/register",(req,resp)=>{

    resp.render("register");
  })
  

 app.post("/register",async (req,resp)=>{

    const{name,email,password}=req.body;
     
    let user = await User.findOne({email});

    if(user){
        return resp.redirect("/login")
    }

    const hashedPassword = await bcrypt.hash(password,10)

    user = await User.create({
        name,
        email,
        password:hashedPassword,
    });

    const token = jwt.sign({ _id: user._id }, 'dmhdljldl');
    
    console.log(token);

    resp.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000)
    });
    resp.redirect("/");

 }) 


app.get("/logout",(req,resp)=>{

    resp.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now())
    });
    resp.redirect("/");
})


app.listen(7000,()=>{
    console.log("app is working");
})