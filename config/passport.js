import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()

passport.use(new GoogleStrategy({                                                            // google strategy
  clientID: process.env.GOOGLE_CLIENT_ID,                                                   // google client id
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,                                          // google client secret
  callbackURL: process.env.GOOGLE_CALLBACK_URL                                            //  google callback url

},
async(accessToken,refreshToken,profile,done)=>{                                                                // google callback
  try{
    const user = await userModel.findOne({ email: profile.emails[0].value })

    if(user) {
      if(!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      done(null, user)
    } else {
      const newUser = await userModel.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
      })
      done(null, newUser)
    }
  }catch (error) {
    done(error, null)
  }
}));

passport.serializeUser((user,done)=>{                                                         // serialize user
  done(null,user.id)
})

passport.deserializeUser(async(id,done)=>{                                                    // deserialize user
  try{
    const user=await userModel.findById(id)
    done(null,user)
  }catch(error){
    done(error,null)
  }
})


export default passport