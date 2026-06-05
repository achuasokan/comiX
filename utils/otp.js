import { Resend } from 'resend';


export const generateOTP = () => {                                                          
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};

export const sendOTPEmail = async (email, otp) => {                          
  
  const resend = new Resend(process.env.RESEND_API_KEY);

  
  const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',            
      to: [email],                                                           
      subject: 'Your OTP Code',                                            
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,            
  });

  if (error) {
      console.error("Resend error:", error);
      throw new Error("Failed to send OTP email");
  }
};