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
async(acessToken,refreshToken,profile,done)=>{                                                                // google callback
  try{
    console.log(1);
    let user=await userModel.findOne({email:profile.emails[0].value})                     // find user
    console.log(`user found ${user}`);

    if(!user){
      console.log(`entered not user`);
      user=await userModel.create({                                                       // create user
        googleId:profile.id,
        name:profile.displayName,                                                         // user name
        email:profile.emails[0].value                                                     // user email
      });
      console.log(`user created`,user);
    }
    done(null,user)
  }catch(error){
    done(error,null)
  }
}

));

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