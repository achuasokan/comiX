import userModel from "../models/User.js";
export const checkUserSession = async (req, res, next) => {

  try {
    if (req.session.userID) {
      const user = await userModel.findById(req.session.userID);
      if (!user) {
        req.session.destroy()
        return res.redirect('/login?message=Your account has been blocked. Please contact Support.');
      }
      if (user && user.isBlocked) {
        req.session.destroy((error) => {
          if (error) {
            console.log("Error destroying session", error);
          }
          return res.redirect('/login?message=Your account has been blocked. Please contact Support.');// Redirect to login page
        });
      } else {
        
        // Set user details in res.locals
        res.locals.user = req.session.userID;
        res.locals.name = req.session.name;
        next();
      }
    } else {
      // If not logged in, set user to null
      res.locals.user = null;
      res.locals.name = null;
      next();
    }
  } catch (error) {
    console.log("Error in check user session", error);
    res.status(500).send("Internal server error");
  }
};

export default checkUserSession;




