import express from 'express'
import * as adminController from '../controllers/admin/adminAuthController.js'                      //import admin auth controller
import * as dashboardController from '../controllers/admin/dashboardController.js'                  //import admin dashboard controller
import * as categoryController from '../controllers/admin/categoryController.js'                    //import admin category controller
import * as userController from '../controllers/admin/userController.js'                            //import admin user controller
import adminMiddleware from '../middleware/adminMiddleware.js'                                      //import admin middleware

const router=express.Router()


router.get('/login',adminController.getAdminLogin)                                                //get admin login

router.post('/login',adminController.postAdminLogin)                                             //post admin login

router.get('/logout',adminController.getLogout)                                                  // admin logout

router.get('/dashboard',adminMiddleware.isAdmin,dashboardController.getDashboard)               //get admin dashboard


router.get('/category',categoryController.getCategory)                                            //get admin category

router.get('/users',adminMiddleware.isAdmin,userController.getUserList)                         //get admin customers

router.post("/block/:id",userController.blockUser)

export default router

