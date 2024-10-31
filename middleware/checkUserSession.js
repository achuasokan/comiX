import userModel from "../models/User.js";

export const checkUserSession = async (req, res, next) => {
  try {
    const userId = req.session.userID;

    if (userId) {
      const user = await userModel.findById(userId);

      //~ If user is not found or is blocked, destroy the session and redirect to login page
      if (!user || user.isBlocked) {
        req.flash('error', 'Your account has been blocked. Please contact Support.');
        req.session.destroy((error) => {
          if (error) {
            console.log("Error destroying session", error);
          }
          return res.redirect('/login');
        });
      } else {

        //~ Set user details in res.locals
        res.locals.user = userId;
        res.locals.name = req.session.name;
        return next();
      }
    } else {
      
      //~ If not logged in, set user to null
      res.locals.user = null;
      res.locals.name = null;
      return next();
    }
  } catch (error) {
    console.log("Error in check user session", error);
    res.status(500).send("Internal server error");
  }
};

export default checkUserSession;