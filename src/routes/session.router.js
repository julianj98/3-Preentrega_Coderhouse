import { Router } from "express";
import userModel from "../dao/mongo/models/user.js";
import passport from "passport";
import { getCurrentUser, registerUser, loginUser, logoutUser } from "../controllers/sessionControllers.js";
const router = Router();

router.get("/github", passport.authenticate("github"), async (req, res) => {});
router.get(
  "/githubcallback",
  passport.authenticate("github"),
  async (req, res) => {
    req.session.user = {
      name: req.user.first_name + " " + req.user.last_name,
      email: req.user.email,
      rol: req.user.email === "adminCoder@coder.com" ? "admin" : "user",
    };
    res.redirect("/products");
  }
);
router.post('/register',registerUser);

router.post('/login',loginUser);

router.post('/logout',logoutUser );

router.get('/current',getCurrentUser)

export default router;