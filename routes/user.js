const express = require('express')
const router = express.Router()
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers')
const cartHelpers = require('../helpers/cart-helpers')
const billingHelpers = require('../helpers/billing-helpers')
const wishlistHelpers = require('../helpers/wishlist-helpers')
const couponHelpers = require('../helpers/coupon-helpers');
const shoppingHelpers = require('../helpers/shopping-helpers');
const async = require('hbs/lib/async')
const { response } = require('../app')
const { cartCount } = require('../helpers/cart-helpers')

require('dotenv').config()
const ServiceSID = process.env.ServiceSID
const AccountSID = process.env.AccountSID
const authToken = process.env.authToken
const client = require('twilio')(AccountSID, authToken)

let filterResult
// middleware for varfying login
const varfyingLoggin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    const userId = req.session.user._id
    userHelpers.getUser(userId).then((user)=>{
      if(user.block == true){
        req.session.userLoggedIn = false
        res.redirect('/user-login')
      } else{
        next()
      }
    })
    
  } else {
    res.redirect('/user-login')
  }
}
/* GET home page. */
router.get('/', async function (req, res) {
  const brands = await shoppingHelpers.getAllbrand()
  const products = await shoppingHelpers.getAllhomeProducts()
  const newArrivals = await shoppingHelpers.GetNewarrivals()
  if (req.session.userLoggedIn) {

    const cartCount = await cartHelpers.cartCount(req.session.user._id)
    const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
    const user = req.session.user
    res.render('user/user-home', { user, products, cartCount, wishlistCount, newArrivals, brands })

  } else {
    res.render('user/user-home', { products, newArrivals, brands })
  }


})
router.get('/user-login', function (req, res) {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  }
  const logError = req.session.loginErr
  const alert = req.flash('msg')
  res.render('user/login', { logError, alert })
  req.session.loginErr = false

})

router.get('/user-signup', function (req, res) {

  res.render('user/signup', { err: req.session.logErr })
  req.session.userLoggedIn = false
})
router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.userMobile = req.body.mobnumber

      client.verify
        .services(ServiceSID)
        .verifications.create({
          to: `+91${req.body.mobnumber}`,
          channel: 'sms'

        })

      res.redirect('/otp')

    } else {
      req.session.userLoggedIn = false
      res.redirect('/user-signup')
    }
  }).catch((err) => {
    req.session.logErr = err.msg
    res.redirect('/user-signup')
  })
})
router.get('/otp', (req, res) => {
  const otpErr = req.session.otpErr
  res.render('user/otp', { otp: true, phNumber: req.session.userMobile, otpErr })
  req.session.otpErr = false
})
router.post('/otpsend', (req, res) => {
  const mob = req.session.userMobile

  client.verify
    .services(ServiceSID)
    .verificationChecks.create({
      to: `+91${mob}`,
      code: req.body.otp
    }).then((response) => {
      console.log(response)
      if (response.valid) {
        // req.session.LoggedIn = true;
        res.redirect('/user-login')
      } else {
        // req.session.LoggedIn = false;
        req.session.otpErr = 'invalid otp'
        res.redirect('/otp')
      }
    })
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      if (response.user.block) {
        req.session.userLoggedIn = false
        req.flash('msg', ' You are Blocked by Admin')
        res.redirect('/user-login')
      } else {
        req.session.user = response.user
        req.session.userLoggedIn = true
        res.redirect('/')
      }
    } else {
      req.session.loginErr = 'Invalid Password'
      res.redirect('/user-login')
    }
  })
})
router.get('/user-logout', (req, res) => {
  req.session.userLoggedIn = false
  res.redirect('/')
})

// forget password
router.get('/forget', (req, res) => {
  res.render('user/forget-mob')
})
router.get('/fgotpcmpage', (req, res) => {
  res.render('user/forget-otp')
})
router.get('/fgedit', (req, res) => {
  res.render('user/forget-editpage')
})

router.post('/fgphnumVarify', (req, res) => {
  req.session.fgmobile = req.body.fgphnum

  userHelpers.doForget(req.body).then((response) => {
    if (response.status) {
      const mob = req.session.fgmobile

      client.verify
        .services(ServiceSID)
        .verifications.create({
          to: `+91${mob}`,
          channel: 'sms'
        }).then((response) => {
          if (response.status) {
            res.redirect('/fgotpcmpage')
          } else {
            res.redirect('/forget')
          }
        })
    } else {
      res.redirect('/forget')
    }
  })
})

router.post('/fgtotpvarfy', (req, res) => {

  const mobile = req.session.fgmobile
  client.verify
    .services(ServiceSID)
    .verificationChecks.create({
      to: `+91${mobile}`,
      code: req.body.fgotp
    }).then((response) => {
      if (response.valid) {
        res.redirect('/fgedit')
      } else {
        res.redirect('/fgotpcmpage')
      }
    })
})
router.post('/editpswrd', (req, res) => {
  userHelpers.doEdit(req.body).then((response) => {
    if (response.status) {
      res.redirect('/user-login')
    } else {
      res.redirect('/fgedit')
    }
  })
})
router.get('/user-home', (req, res) => {
  res.redirect('/')
})

// cart section start
router.get('/cart', varfyingLoggin, async (req, res) => {
  let total = 0
  const user = req.session.user
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const products = await cartHelpers.getCartProducts(req.session.user._id)
  if (products.length > 0) {
    total = await billingHelpers.getTotalAmount(req.session.user._id)
    res.render('user/cart', { user, products, cartCount, total, wishlistCount })
  } else {
    res.render('user/cart-empty', { user, cartCount, total, wishlistCount })
  }
})
router.get('/add-to-cart/:id', varfyingLoggin, async (req, res) => {

  const product = await productHelpers.getOneProductDetails(req.params.id)
  cartHelpers.addtoCart(req.params.id, req.session.user._id, product.Brand).then((response) => {
    cartHelpers.getTotalAmountForOneProduct(req.params.id, req.session.user._id).then(() => { })
    res.json(response)
  })
})
router.post('/change-product-quantity', async (req, res) => {

  cartHelpers.changeProductQuantity(req.body).then(async (response) => {
    cartHelpers.changeCartSubtotal(req.body).then(() => { })
    const products = await cartHelpers.getCartProducts(req.session.user._id)
    if (products.length > 0) {
      response.total = await billingHelpers.getTotalAmount(req.body.user)
    }
    res.json(response)
  })
})
router.post('/delete-product', (req, res) => {
  cartHelpers.deleteProduct(req.body).then((response) => {
    res.json(response)
  })
})

// order section starts
router.get('/place-order', varfyingLoggin, async (req, res) => {
  let subtotal = 0
  let grandTotal = 0
  const user = req.session.user

  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const products = await cartHelpers.getCartProducts(req.session.user._id)
  if (products.length > 0) {
    subtotal = await billingHelpers.getTotalAmount(req.session.user._id)
    grandTotal = subtotal + 40
  }
  const coupon = await couponHelpers.getCouponUser()
  const Addresses = await userHelpers.getAddress(user._id)
  res.render('user/place-order', { subtotal, user, Addresses, products, coupon, grandTotal, cartCount, wishlistCount })
})
router.post('/place-order', async (req, res) => {
  console.log(req.body)
  const products = await billingHelpers.getCartProductList(req.body.userId)
  const subtotal = await billingHelpers.getTotalAmount(req.body.userId)

  let total = subtotal
  billingHelpers.placeOrder(req.body, products, req.body.userId).then((response) => {
    response.codSuccess = true
    req.session.orderId = response.insertedId
    if (req.body['payment-method'] === 'COD') {
      res.json(response)
    } else {
      billingHelpers.generateRazorpay(response.insertedId, total).then((resp) => {
        res.json(resp)
      })
    }
  })
})
router.get('/order-completed', varfyingLoggin, async (req, res) => {
  const user = req.session.user

  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const orderProducts = await billingHelpers.getOrderProducts(req.session.orderId)
  const orderedDetails = await billingHelpers.getOrderedDetails(req.session.orderId)
  res.render('user/order-success', { user, orderProducts, orderedDetails, cartCount, wishlistCount })
})
router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  billingHelpers.verifyPayment(req.body).then(() => {
    billingHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success');
      res.json({ stat: true })
    })

  }).catch((err) => {
    res.json({ stat: false })
  })
})

// wish-list starts
router.get('/add-to-wishList/:id',varfyingLoggin, (req, res) => {
  wishlistHelpers.addtoWishlist(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  })
})
router.get('/wishList', varfyingLoggin, async (req, res) => {
  const user = req.session.user
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  const products = await wishlistHelpers.getWishlistProducts(req.session.user._id)
  if (products.length > 0) {
    res.render('user/wish-list', { user, products, wishlistCount, cartCount })
  } else {
    res.render('user/wishlist-empty', { user, wishlistCount, cartCount })
  }
})
router.post('/delete-wishlist-product', (req, res) => {
  console.log(req.body);
  wishlistHelpers.deleteProduct(req.body).then((response) => {
    res.json(response)
  })
})
router.post('/wishlist-to-cart', async (req, res) => {
  // console.log(req.body);
  const product = await productHelpers.getOneProductDetails(req.body.product)
  cartHelpers.addtoCart(req.body.product, req.body.user, product.Brand).then((response) => {
    wishlistHelpers.deleteProduct(req.body).then((response) => {
      res.json(response)
    })
  })
})

// view product
router.get('/view-prod', async (req, res) => {
  product = req.session.viewProduct
  if (req.session.userLoggedIn) {
    user = req.session.user
    const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
    const cartCount = await cartHelpers.cartCount(req.session.user._id)
    res.render('user/view-product', { product, user, wishlistCount, cartCount })
  } else {
    res.render('user/view-product', { product })
  }

})
router.get('/prod-details/:id', async (req, res) => {
  let product = await productHelpers.getOneProductDetails(req.params.id)
  req.session.viewProduct = product
  res.redirect('/view-prod')
})
router.post('/viewprod-to-cart',varfyingLoggin, async (req, res) => {
  const product = await productHelpers.getOneProductDetails(req.body.product)
  cartHelpers.addtoCart(req.body.product, req.body.user, product.Brand).then((response) => {
    res.json(response)
  })
})

// user profile page
router.get('/user-profile', varfyingLoggin, async (req, res) => {
  const user = req.session.user
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  res.render('user/profile', { user, wishlistCount, cartCount })

})
router.get('/edit-profile',varfyingLoggin, async (req, res) => {
  const user = req.session.user
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  res.render('user/profile-edit', { ftwo: true, user, wishlistCount, cartCount })
})
router.post('/editProfile-details', (req, res) => {
  const user = req.session.user

  userHelpers.editUserAddress(user._id, req.body).then((response) => {
    res.redirect('/user-profile')

  })
})
router.get('/address-page',varfyingLoggin, async (req, res) => {
  const user = req.session.user
  let Addresses = await userHelpers.getAddress(user._id)
  const wishlistCount = await wishlistHelpers.wishlistCount(user._id)
  const cartCount = await cartHelpers.cartCount(user._id)
  res.render('user/profile-address', { ftwo: true, user, wishlistCount, cartCount, Addresses })
})
router.get('/addAddress',varfyingLoggin, async (req, res) => {
  const user = req.session.user
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  res.render('user/profile-add-newAddress', { ftwo: true, user, wishlistCount, cartCount })
})
router.post('/addAddress', (req, res) => {
  const user = req.session.user
  userHelpers.updateUserDetails(user._id, req.body).then((response) => {
    // let Addresses = await userHelpers.getAddress(req.params.id)
    console.log(response)
    res.redirect('/address-page')
  })
})
router.get('/user-forgot-password', (req, res) => {
  res.redirect('/forget')
})
router.get('/user-wishlist', (req, res) => {
  res.redirect('/wishList')
})
router.get('/user-cart', (req, res) => {
  res.redirect('/cart')
})
router.get('/editAddress/:id',varfyingLoggin, async (req, res) => {
  const user = req.session.user
  const address = await userHelpers.getOneAddress(req.params.id, user._id)
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  res.render('user/profile-editAddress', { address, user, wishlistCount, cartCount })
})
router.post('/editAddress/:id', async (req, res) => {
  const user = req.session.user
  const address = await userHelpers.getOneAddress(req.params.id, user._id)
  userHelpers.editAddress(address.id, user._id, req.body).then((response) => {
    res.redirect('/address-page')
  })
})
router.get('/deleteAddress/:id',varfyingLoggin, async (req, res) => {
  const user = req.session.user
  const address = await userHelpers.getOneAddress(req.params.id, user._id)
  userHelpers.deleteAddress(address.id, user._id).then((response) => {
    res.redirect('/address-page')
  })
})
router.get('/allOrders',varfyingLoggin, async (req, res) => {
  const user = req.session.user
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const orders = await billingHelpers.getAllOrders(user._id)
  res.render('user/ordersAll', { orders, user, cartCount, wishlistCount })
})
router.get('/viewOrderProducts/:id',varfyingLoggin, async (req, res) => {
  const user = req.session.user
  const orderProducts = await billingHelpers.getOrderProducts(req.params.id)
  const orderedDetails = await billingHelpers.getOrderedDetails(req.params.id)
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  if (orderedDetails.status == 'failed') {
    proLength = orderProducts.length
    res.render('user/pending-order', { user, orderProducts, orderedDetails, proLength, cartCount, wishlistCount })
  } else {
    if (orderProducts.length > 0) {
      proLength = orderProducts.length
      res.render('user/ordered-products', { user, orderProducts, orderedDetails, proLength, cartCount, wishlistCount })
    }
  }
})
router.get('/view-oneOrder-product/:id',varfyingLoggin, async (req, res) => {
  let orderId = req.params.id
  let { proId, proLength, orderCancelCount } = req.query
  const user = req.session.user
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  const products = await productHelpers.productDetail(proId)
  const orderProducts = await billingHelpers.getOneOrderProduct(orderId, proId)
  if (orderProducts.length > 0) {
    res.render('user/order-singleView', { user, orderProducts, products, proLength, orderCancelCount, cartCount, wishlistCount })
  }
})
router.post('/cancel-order', (req, res) => {
  billingHelpers.cancelSingleOrderProduct(req.body.orderId, req.body.proId, req.body.subtotal, req.body.totalAmount, req.body.couponPercent, req.body.reFund, req.body.proLength, req.body.orderCancelCount).then(async (response) => {

    res.json({ status: true })
  })
})
router.get('/get-invoice/:id',varfyingLoggin, async (req, res) => {
  const user = req.session.user
  const orderProducts = await billingHelpers.getOrderProducts(req.params.id)
  const orderedDetails = await billingHelpers.getOrderedDetails(req.params.id)
  const cartCount = await cartHelpers.cartCount(req.session.user._id)
  const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
  res.render('user/invoice', { user, orderProducts, orderedDetails, cartCount, wishlistCount })
})

// cupen section strats
router.post("/couponApply", async (req, res) => {
  let todayDate = new Date().toISOString().slice(0, 10);
  let startCoupon = await couponHelpers.startCouponOffer(todayDate);
  const userId = req.session.user._id;
  couponHelpers.validateCoupon(req.body, userId).then((response) => {
    console.log(response);
    req.session.couponTotal = response.total;
    if (response.success) {
      res.json({ couponSuccess: true, total: response.total });
    } else if (response.couponUsed) {
      res.json({ couponUsed: true });
    } else if (response.couponExpired) {
      res.json({ couponExpired: true });
    } else if (response.couponMaxLimit) {
      res.json({ couponMaxLimit: true });
    } else {
      res.json({ invalidCoupon: true });
    }
  })
})

// search section
router.post("/searchResults", async (req, res) => {
  let key = req.body.key;
  filterResult = await productHelpers.getSearchProducts(key);
  res.redirect('/products')
});

// shopping section
router.get('/shopping', async (req, res) => {
  filterResult = await productHelpers.getAllProducts()
  res.redirect('/products')

})
router.post('/search-brand', (req, res) => {
  console.log(req.body);
  let a = req.body
  let price = parseInt(a.Prize)
  let brandFilter = []
  let cateFilter=[]
  
  for (let i of a.Brand) {
    brandFilter.push({ 'Brand': i })
  }
  for (let i of a.Category) {
    cateFilter.push({ 'Category': i })
  }
  shoppingHelpers.searchFilter(brandFilter,cateFilter, price).then((result) => {
    filterResult = result
    res.json({ status: true })
  })
})
router.get('/products', async (req, res) => {
  const user = req.session.user
  const brand = await shoppingHelpers.getAllbrand()
  const category = await shoppingHelpers.getAllcategory()
  if(user){
    const cartCount = await cartHelpers.cartCount(req.session.user._id)
    const wishlistCount = await wishlistHelpers.wishlistCount(req.session.user._id)
    res.render('user/shopping', { filterResult, brand, category,user,cartCount,wishlistCount })
  } else {
    res.render('user/shopping', { filterResult, brand, category })

  }
})
router.get('/oneBrand/:id', async (req, res) => {
  filterResult = await shoppingHelpers.getOneBrand(req.params.id)
  res.redirect('/products')
})
router.get('/latest-products', async (req, res) => {
  filterResult = await shoppingHelpers.Newarrivals()
  res.redirect('/products')
})
module.exports = router  


