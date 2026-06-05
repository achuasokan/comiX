import walletModel from "../../models/wallet.js"
import { STATUS_CODES } from '../../constants/statusCodes.js'
import { MESSAGES } from '../../constants/messages.js'

//* //  //  //   //  //          GET WALLET PAGE    //  //  //  //  //  //  //

export const getWalletPage = async (req,res) => {
  try {
    const userID = req.session.userID

    const wallet = await walletModel.findOne({user:userID})

    if (!wallet) {
      return res.render('profile/wallet',{wallet:null,title:"Wallet"})
    }
    
    wallet.transaction.sort((a,b)=>b.transactionDate-a.transactionDate)

    res.render('profile/wallet',{wallet,title:"Wallet"})
  } catch (error) {
    console.error("error in get wallet page",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}
