import express from 'express'
import adminMiddleware from '../middleware/adminMiddleware.js'   
import * as adminController from '../controllers/admin/adminAuthController.js'                      
import * as dashboardController from '../controllers/admin/dashboardController.js'                  
import * as categoryController from '../controllers/admin/categoryController.js'                    
import * as productController from '../controllers/admin/productController.js'                      
import * as userController from '../controllers/admin/userController.js'                                                              
import * as discountController from "../controllers/admin/discountController.js"
import * as orderController from '../controllers/admin/orderController.js'
import * as couponController from '../controllers/admin/couponController.js'
import upload from '../middleware/multerMiddleware.js'

const router=express.Router()


//^  //  //  //  //  //  //                Admin Auth routes             //  //  //  //  //  //  //

router.get('/login',adminController.getAdminLogin)                                               

router.post('/login',adminController.postAdminLogin)                                             

router.get('/logout',adminController.getLogout)                                                  

//^  //  //  //  //  //  //                Dashboard routes             //  //  //  //  //  //  //

router.get('/dashboard',adminMiddleware.isAdmin,dashboardController.getDashboard)               



//^  //  //  //  //  //  //                  User routes                //  //  //  //  //  //  //

router.get('/users',adminMiddleware.isAdmin,userController.getUserList)                        

router.post("/block/:id",adminMiddleware.isAdmin,userController.blockUser)

router.get('/searchUser',adminMiddleware.isAdmin,userController.searchUser)


//^  //  //  //  //  //  //                Category routes                //  //  //  //  //  //  //

router.get('/category',adminMiddleware.isAdmin,categoryController.getCategory)                                            

router.get('/addCategory',adminMiddleware.isAdmin,categoryController.getAddCategory)

router.post('/addCategory',upload.single('image'),adminMiddleware.isAdmin,categoryController.postAddCategory)

router.get('/editCategory/:id',adminMiddleware.isAdmin,categoryController.getEditCategory)

router.post('/editCategory/:id',upload.single('image'),adminMiddleware.isAdmin,categoryController.postEditCategory)

router.post('/blockCategory/:id',adminMiddleware.isAdmin,categoryController.blockCategory)

router.get('/searchCategory',adminMiddleware.isAdmin,categoryController.searchCategory)

router.delete('/deleteCategory/:id',adminMiddleware.isAdmin,categoryController.deleteCategory)



//^  //  //  //  //  //  //                ProductRoutes                //  //  //  //  //  //  //

router.get('/products',adminMiddleware.isAdmin,productController.getProduct)

router.get('/addProduct',adminMiddleware.isAdmin,productController.getAddProduct)

router.post('/addProduct', upload.array('image', 5), adminMiddleware.isAdmin,productController.postAddProduct);

router.post("/softDeleteProduct/:id",adminMiddleware.isAdmin,productController.softDeleteProduct)

router.get('/editProduct/:id',adminMiddleware.isAdmin,productController.getEditProduct)

router.post('/editProduct/:id',upload.array('image',5),adminMiddleware.isAdmin,productController.postEditProduct)

router.delete('/deleteProduct/:id',adminMiddleware.isAdmin,productController.deleteProduct)




//^  //  //  //  //  //  //                Discounts routes                //  //  //  //  //  //  //

router.get('/discounts',adminMiddleware.isAdmin,discountController.getDiscountListPage)

router.route('/addDiscount')
    .get(adminMiddleware.isAdmin,discountController.addDiscountPage)
    .post(adminMiddleware.isAdmin,discountController.addDiscount)

router.get('/editDiscount/:id',adminMiddleware.isAdmin,discountController.editDiscountPage)

router.post('/editDiscount/:id',adminMiddleware.isAdmin,discountController.postEditDiscount)

router.post('/discounts/block/:id',adminMiddleware.isAdmin,discountController.blockDiscount)




//^  //  //  //  //  //  //                 Order routes                    //  //  //  //  //  //  //

router.get('/orders',adminMiddleware.isAdmin,orderController.getOrderListPage)

router.post('/orders/:orderId/:itemId/change-status',adminMiddleware.isAdmin,orderController.changeItemStatus)

router.get('/orders/:orderId/details',adminMiddleware.isAdmin,orderController.getOrderDetails)

router.get('/orders/:orderId/:itemId/return-details',adminMiddleware.isAdmin,orderController.getReturnRequestDetails)
router.post('/orders/:orderId/:itemId/change-return-status',adminMiddleware.isAdmin,orderController.changeReturnStatus)


//^  //  //  //  //  //  //                 Coupon routes                    //  //  //  //  //  //  //

router.get('/coupons',adminMiddleware.isAdmin,couponController.getCouponListPage)

router.route('/addCoupon')
    .get(adminMiddleware.isAdmin,couponController.addCouponPage)
    .post(adminMiddleware.isAdmin,couponController.postAddCoupon)

router.get('/editCoupon/:id',adminMiddleware.isAdmin,couponController.getEditCouponPage)

router.post('/editCoupon/:id',adminMiddleware.isAdmin,couponController.postEditCoupon)

router.post('/deleteCoupon/:id',adminMiddleware.isAdmin,couponController.deleteCoupon)






export default router

