import express from 'express'
import * as adminController from '../controllers/admin/adminAuthController.js'                      //import admin auth controller
import * as dashboardController from '../controllers/admin/dashboardController.js'                  //import admin dashboard controller
import * as categoryController from '../controllers/admin/categoryController.js'                    //import admin category controller
import * as productController from '../controllers/admin/productController.js'                      //import admin product controller
import * as userController from '../controllers/admin/userController.js'                            //import admin user controller
import adminMiddleware from '../middleware/adminMiddleware.js'                                      //import admin middleware
import * as discountController from "../controllers/admin/discountController.js"
import upload from '../middleware/multerMiddleware.js'

const router=express.Router()

// //  //  //      Admin Auth routes  //  //  //  //  //

router.get('/login',adminController.getAdminLogin)                                                //get admin login

router.post('/login',adminController.postAdminLogin)                                             //post admin login

router.get('/logout',adminController.getLogout)                                                  // admin logout

// //  //  //      Dashboard routes  //  //  //  //  //

router.get('/dashboard',adminMiddleware.isAdmin,dashboardController.getDashboard)               //get admin dashboard



// //  //  //      User routes  //  //  //  //  //

router.get('/users',adminMiddleware.isAdmin,userController.getUserList)                         //get admin customers

router.post("/block/:id",adminMiddleware.isAdmin,userController.blockUser)

router.get('/searchUser',adminMiddleware.isAdmin,userController.searchUser)


 // //  //  //      Category routes  //  //  //  //  //

router.get('/category',adminMiddleware.isAdmin,categoryController.getCategory)                                            //get admin category

router.get('/addCategory',adminMiddleware.isAdmin,categoryController.getAddCategory)

router.post('/addCategory',upload.single('image'),adminMiddleware.isAdmin,categoryController.postAddCategory)

router.get('/editCategory/:id',adminMiddleware.isAdmin,categoryController.getEditCategory)

router.post('/editCategory/:id',upload.single('image'),adminMiddleware.isAdmin,categoryController.postEditCategory)

router.post('/blockcategory/:id',adminMiddleware.isAdmin,categoryController.blockCategory)

router.get('/searchCategory',adminMiddleware.isAdmin,categoryController.searchCategory)



// //  //  //      products routes  //  //  //  //  //

router.get('/products',adminMiddleware.isAdmin,productController.getProduct)

router.get('/addProduct',adminMiddleware.isAdmin,productController.getAddProduct)

router.post('/addProduct', upload.array('image', 5), adminMiddleware.isAdmin,productController.postAddProduct);

router.post("/softDeleteProduct/:id",adminMiddleware.isAdmin,productController.softDeleteProduct)

router.get('/editProduct/:id',adminMiddleware.isAdmin,productController.getEditProduct)

router.post('/editProduct/:id',upload.array('image',5),adminMiddleware.isAdmin,productController.postEditProduct)




// //  //  //      Discount routes  //  //  //  //  //

router.get('/discounts',adminMiddleware.isAdmin,discountController.getDiscountListPage)

router.get('/addDiscount',adminMiddleware.isAdmin,discountController.addDiscountPage)

router.post('/addDiscount',adminMiddleware.isAdmin,discountController.addDiscount)

router.get('/editDiscount/:id',adminMiddleware.isAdmin,discountController.editDiscountPage)

router.post('/editDiscount/:id',adminMiddleware.isAdmin,discountController.postEditDiscount)

router.post('/discounts/block/:id',adminMiddleware.isAdmin,discountController.blockDiscount)

export default router

