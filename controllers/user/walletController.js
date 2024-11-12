import walletModel from "../../models/wallet.js"

//* //  //  //   //  //          GET WALLET PAGE    //  //  //  //  //  //  //

export const getWalletPage = async (req,res) => {
  try {
    const userID = req.session.userID

    const wallet = await walletModel.findOne({user:userID})

    if (!wallet) {
      return res.status(404).send("wallet not found")
    }
    
    wallet.transaction.sort((a,b)=>b.transactionDate-a.transactionDate)

    res.render('profile/wallet',{wallet,title:"Wallet"})
  } catch (error) {
    console.error("error in get wallet page",error);
    res.status(500).send("internal server error in get wallet page")
  }
}
