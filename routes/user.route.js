const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const mailer = require("../services/mailer");
const multer = require("multer");
const upload = multer({
  limits: {
    fileSize: 5000000
  }
}).single('file');


const {
  User,
  validate
} = require("../models/user.model");
const express = require("express");
const router = express.Router();



async function getCurrentUser(req) {
  return await User.findById(req.user._id);
}

router.get("/current", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/signup", async (req, res) => {
  // validate the request body first
  const {
    error
  } = validate(req.body);
  if (error) {
    return res.status(400).send({
      error: error.details[0].message
    });
  }

  //find an existing user
  let user = await User.findOne({
    email: req.body.email
  });
  if (user) {
    return res.status(400).send({
      error: "User already registered."
    });
  }

  user = new User({
    name: req.body.name,
    password: req.body.password,
    email: req.body.email
  });
  user.password = await bcrypt.hash(user.password, 10);
  await user.save();
  mailer.notifySignUp(user.email, user.name, req.body.password);

  const token = user.generateAuthToken();
  res.header("x-auth-token", token).send({
    _id: user._id,
    name: user.name,
    email: user.email
  });
});


router.post("/login", async (req, res) => {

  let user = await User.findOne({
    email: req.body.email
  });
  if (!user) {
    return res.status(400).send({
      error: "User not registered."
    });
  }

  if (!await bcrypt.compare(req.body.password, user.password)) {
    return res.status(400).send({
      error: "Wrong password."
    });
  }

  user.lastSeen = Date.now();
  await user.save();

  const token = user.generateAuthToken();
  res.header("x-auth-token", token).send({
    _id: user._id,
    name: user.name,
    email: user.email
  });

});






router.post("/upload/avatar", auth, async (req, res, next) => {

  upload(req, res, async (err) => {
    if (err) {
      // An error occurred when uploading
      console.log(err);
      return res.status(422).send("an Error occured")
    }
    // No error occured.
    //console.log(req.file);

    let me = await User.findById(req.user._id);

    me.avatar = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    await me.save();
    return res.status(200).send();
  });
})

router.post("/friendRequest", auth, async (req, res) => {
  let friend = await User.findOne({
    name: req.body.name,
    tag: req.body.tag
  });
  if (!friend) {
    return res.status(400).send("User not found");
  }
  let me = await getCurrentUser(req);
  if (!me.friends) {
    me.friends = [];
  }

  if (me.friends.includes(friend._id)) {
    return res.status(400).send("User already added");
  }
  me.friends.push(friend._id);
  me.save();
  friend.friends.push(req.user._id);
  await friend.save();
  return res.status(200).send({
    msg: "User added to friends"
  });
});

router.get("/friends", auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate("friends").select("-password");
  res.send(user);
});

// router.get("/", async (req, res) => {

//   res.status(200).send(await User.find({}).select("-password -avatar"));

// });

module.exports = router;