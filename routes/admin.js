var express = require('express');
const { response } = require('../app');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const cartHelpers = require('../helpers/cart-helpers')
const couponHelpers = require('../helpers/coupon-helpers');
const storage = require('../middleware/multer');
const multer = require('multer');
const async = require('hbs/lib/async');
const flash = require('connect-flash');
const billingHelpers = require('../helpers/billing-helpers');
const { promise } = require('bcrypt/promises');

/* GET users listing. */
const varfyingLoggedin = (req, res, next) => {
  if (req.session.adminLoggedin) {
    next()
  } else {
    res.render('admin/login', { admin: true })
  }
}
router.get('/',varfyingLoggedin, function (req, res) {
  res.redirect('/admin/dashboard')
})
router.get('/dashboard',varfyingLoggedin, function (req, res) {
  res.render('admin/admin-home', { admin: true,ftwo:true })
})
router.post('/login', function (req, res, next) {
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = req.body
      req.session.adminLoggedin = true
      res.redirect('/admin/dashboard')
    } else {
      res.redirect('/admin')
    }
  })
});
router.get('/admin-logout', async (req, res) => {
  
  req.session.adminLoggedin = false
  
  res.redirect('/admin')
})
// add product
router.get('/product-table',varfyingLoggedin, async function (req, res, next) {
  const categories = await productHelpers.getAllCategory()
  const brands = await productHelpers.getAllBrands()
  productHelpers.getAllProducts().then((products) => {
    const alert = req.flash('msg')
    res.render('admin/product-table', { ftwo: true, admin: true, products, alert, categories, brands })
  })
})
router.get('/add-productss',varfyingLoggedin,  async function (req, res, next) {
  const categories = await productHelpers.getAllCategory()
  const brands = await productHelpers.getAllBrands()
  res.render('admin/add-product', { admin: true, ftwo: true, categories, brands })
})
router.post('/add-product', storage.fields([{ name: 'images', maxCount: 1 }, { name: 'images1', maxCount: 1 }, { name: 'images2', maxCount: 1 }, { name: 'images3', maxCount: 1 }]), function (req, res) {
  productHelpers.addProduct(req.body).then((prodId) => {

    let img1 = req.files.images[0].filename
    let img2 = req.files.images1[0].filename
    let img3 = req.files.images2[0].filename
    let img4 = req.files.images3[0].filename

    productHelpers.addImage(prodId, img1, img2, img3, img4).then(() => {
      res.redirect('/admin/product-table')
    })
  })
})

// delete product
router.get('/delete-product/:id', (req, res) => {
  //in get method value passed through URL, so use req.params. In post: req.body
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((response) => {
    req.flash('msg', 'You Deleted successfully!')
    res.redirect('/admin/product-table')
  })
})
router.get('/delete-user/:id', (req, res) => {
  //in get method value passed through URL, so use req.params. In post: req.body
  let userId = req.params.id
  userHelpers.deleteUser(userId).then((response) => {
    req.flash('msg', 'You Deleted successfully!')
    res.redirect('/admin/user-table')
  })
}),
  // for edit product
  router.get('/edit-product/:id', async (req, res) => {
    const prodData = await productHelpers.productDetail(req.params.id)
    // console.log(prodData);
    res.render('admin/edit-product', { admin: true, ftwo: true, prodData })
  })
router.post('/edit-products/:id', storage.fields([{ name: 'images', maxCount: 1 }, { name: 'images1', maxCount: 1 }, { name: 'images2', maxCount: 1 }, { name: 'images3', maxCount: 1 }]), function (req, res) {
  
  const img1 = req.files.images ? req.files.images[0].filename : req.body.images
  const img2 = req.files.images1 ? req.files.images1[0].filename : req.body.images1
  const img3 = req.files.images2 ? req.files.images2[0].filename : req.body.images2
  const img4 = req.files.images3 ? req.files.images3[0].filename : req.body.images3
  productHelpers.editProduct(req.body, req.params.id, img1, img2, img3, img4).then((prodId) => {
    res.redirect('/admin/product-table')
  })
})

// managing user details
router.get('/User-Table',varfyingLoggedin, function (req, res, next) {
  userHelpers.getAllusers().then((User) => {
    // console.log(User);
    const alert = req.flash('msg')
    res.render('admin/user-table', { ftwo: true, admin: true, User, alert })
  })
})
router.get('/blockUser/:id', (req, res) => {
  userHelpers.blockUser(req.params.id).then((userName) => {
    // req.session.userLoggedIn = false
    req.flash('msg', 'You Blocked ' + userName)
    res.redirect('/admin/User-Table')
  })
})
router.get('/unblockUser/:id', (req, res) => {
  let ID = req.params.id;
  userHelpers.unblockUser(req.params.id).then((userName) => {
    // req.session.userLoggedIn = true;
    req.flash('msg', 'You Unblocked  ' + userName) 
    res.redirect("/admin/User-Table");
  });
});

// category & brand section starts
router.get('/category', async function (req, res) {
  const categories = await productHelpers.getAllCategory()
  const alert = req.flash('msg')
  res.render('admin/category', { ftwo: true, admin: true, alert, categories })
})
router.post('/add-category', function (req, res, next) {
  productHelpers.addCategory(req.body).then((response) => {
    res.redirect('/admin/category')
  })
})
router.get('/delete-category/:id', (req, res) => {
  const catId = req.params.id
  productHelpers.deleteCategory(catId).then((response) => {
    req.flash('msg', 'You Deleted successfully!')
    res.redirect('/admin/category')
  })
})
router.get('/brand', async function (req, res, next) {
  const brands = await productHelpers.getAllBrands()
  const alert = req.flash('msg')
  res.render('admin/brand', { ftwo: true, admin: true, alert, brands })
})
router.post('/add-brand',storage.single('brandLogo'), function (req, res, next) {
 
  let img = req.file.filename
  
  productHelpers.addBrand(req.body,img).then((response) => {
    res.redirect('/admin/brand')
  })
})
router.get('/edit-brand/:id', async (req, res) => {
  const brandId = req.params.id
  const brand = await productHelpers.getOneBrands(brandId)
  res.render('admin/brand-edit', { admin: true, ftwo: true, brand })
})
router.post('/edit-brand',storage.single('brandLogo'),(req,res)=>{
  let img = req.file.filename
  productHelpers.editBrand(req.body,img).then((prodId) => {
    res.redirect('/admin/brand')
  })
})
router.get('/delete-brand/:id', (req, res) => {
  const brandId = req.params.id
  productHelpers.deleteBrand(brandId).then((response) => {
    req.flash('msg', 'You Deleted successfully!')
    res.redirect('/admin/brand')
  })
})
// order mangement
router.get('/order-management', async (req, res) => {
  const orders = await billingHelpers.getOrderCollection()
  res.render('admin/orders', { admin: true, ftwo: true, orders })
})

router.get('/viewOrderProducts/:id', async (req, res) => {
  const orderProducts = await billingHelpers.getOrderProducts(req.params.id)
  const orderedDetails = await billingHelpers.getAdminOrderedDetails(req.params.id)
  res.render('admin/order-details', { admin: true, ftwo: true, orderProducts, orderedDetails })
})
router.post('/change-orderStatus', (req, res) => {
  // console.log(req.body);
  billingHelpers.changeOrderStatus(req.body).then(async (response) => {
    const orderProducts = await billingHelpers.getOrderProducts(req.body.orderId)
    const orderedDetails = await billingHelpers.getAdminOrderedDetails(req.body.orderId)
    let subtotal = orderedDetails.totalAmount
    res.render('admin/order-details', { admin: true, ftwo: true, orderProducts, orderedDetails })
  })
})

// coupon section starts
router.get('/coupon-management',varfyingLoggedin, (req, res) => {
  couponHelpers.getCoupon().then((coupon) => {
    console.log(coupon);
    res.render('admin/coupon', { admin: true, ftwo: true, coupon })
  })
})
router.get('/addCoupon',varfyingLoggedin, (req, res) => {
  res.render('admin/coupon-add', { admin: true, otp: true })
})
router.post('/addCoupon',varfyingLoggedin, (req, res) => {
  couponHelpers.addNewCoupon(req.body).then(() => {
    res.redirect('/admin/coupon-management')
  }).catch((err) => {
    console.log(err);
  });

});
router.get('/deleteCoupon/:id', (req, res) => {
  couponHelpers.deleteCoupon(req.params.id).then(() => {
    res.redirect('/admin/coupon-management')
  })
})
router.get('/editCoupon/:id', (req, res) => {
  couponHelpers.getOneCoupon(req.params.id).then((coupon) => {
    res.render('admin/coupon-edit', { admin: true, ftwo: true, coupon })
  })
});
router.post('/editCoupon/:id', (req, res) => {
  couponHelpers.getOneCoupon(req.params.id).then((coupon) => {
    res.redirect('/admin/coupon-management')
  })
});


// admin graph section
router.post('/getData', async (req, res) => {
  console.log(req.body, 'req.body');
  const date = new Date(Date.now());
  const month = date.toLocaleString("default", { month: "long" });
  adminHelpers.salesReport(req.body).then((data) => {

    let pendingAmount = data.pendingAmount
    let salesReport = data.salesReport
    let brandReport = data.brandReport
    let orderCount = data.orderCount
    let totalAmountPaid = data.totalAmountPaid
    let totalAmountRefund = data.totalAmountRefund

    let dateArray = [];
    let totalArray = [];
    salesReport.forEach((s) => {
      dateArray.push(`${month}-${s._id} `);
      totalArray.push(s.total);
    })
    let brandArray = [];
    let sumArray = [];
    brandReport.forEach((s) => {
      brandArray.push(s._id);
      sumArray.push(s.totalAmount);
    });
    console.log("", brandArray);
    console.log("", sumArray);
    console.log("", dateArray);
    console.log("", totalArray);
    res.json({ dateArray, totalArray, brandArray, sumArray, orderCount, totalAmountPaid, totalAmountRefund, pendingAmount })
  })
})
module.exports = router;

