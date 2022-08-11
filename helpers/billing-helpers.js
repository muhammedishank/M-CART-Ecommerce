const db = require('../config/connections')
const collection = require('../config/collections')
const { PRODUCT_COLLECTION } = require('../config/collections')
const { response, options } = require('../app')
const ObjectId = require('mongodb').ObjectId
const RazorPay = require('razorpay')
const async = require('hbs/lib/async')
require('dotenv').config()
const keyId = process.env.key_id
const keySecret = process.env.key_secret
var instance = new RazorPay({

    key_id: keyId,
    key_secret: keySecret

})

module.exports = {

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            const total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totals: {
                            $sum: {
                                $multiply: [
                                    { $toInt: '$quantity' }, { $toInt: '$product.Prize' }
                                ]
                            }
                        }
                    }
                }
            ]).toArray()
            resolve(total[0].totals)
        })
    },


  


    placeOrder: (order, products) => {
       
        let couponOff = 0
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: order.coupon })

            if (coupon) {
                couponOff = coupon.offer
            }

            let totalAmount = parseInt(order.total)
            let subTotal = parseInt(order.subTotal)
            let grandTotal = parseInt(order.amountToBePaid)
            let reFund = parseInt(order.reFund)

            console.log(couponOff);

            let status = order['payment-method'] === 'COD' ? 'placed' : 'failed'
            let orderObj = {
                deliveryDetails: {
                    firstName: order.fname,
                    lastName: order.lname,
                    mobile: order.phoneNumber,
                    email: order.email,
                    address1: order.add1,
                    town: order.town,
                    district: order.district,
                    state: order.state,
                    zip: order.pincode
                },
                userId: ObjectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                status: status,

                totalAmountWithoutShipping: totalAmount,
                totalAmountPaid: grandTotal,
                totalAmountToBePaid: grandTotal,

                couponPercent: couponOff,
                couponDiscount: order.discountedPrice,
                reFund: reFund,
                orderCancelCount: 0,
                date: new Date()


            }
            
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {

                products.forEach(async (result) => {
        
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(result.item)},
                    { $inc: { Stock: -result.quantity } })
              
              
                  })
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
                let userId = order.userId;
                userId = userId.toString();
                db.get().collection(collection.COUPON_COLLECTION).updateOne(
                    { coupon: order.coupon },
                    {
                        $push: { users: userId },
                        $inc: { limit: -1 },
                    }
                )
                resolve(response)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            resolve(cart.products)

        })

    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            const orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $unwind: '$products',
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        status: '$products.status',
                        subtotal:'$products.subtotal'

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        status: 1,
                        subtotal:1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },
    getOneOrderProduct: (orderId, proId) => {
        return new Promise(async (resolve, reject) => {
            const orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $unwind: '$products',
                },
                {
                    $match: { 'products.item': ObjectId(proId) }   
                },
                {
                    $project: {

                        item: '$products.item',
                        quantity: '$products.quantity',
                        status: '$products.status',
                        subtotal: '$products.subtotal',
                        totalAmountToBePaid: '$totalAmountToBePaid',
                        couponPercent: '$couponPercent',
                        reFund: '$reFund'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        pipeline: [
                            { $match: { 'products.item': ObjectId(proId) } }
                        ],
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        status: 1,
                        subtotal: 1,
                        totalAmountToBePaid: 1,
                        couponPercent: 1,
                        reFund: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }
            ]).toArray()

            if (orderItems[0].status == 'Ordered') {
                orderItems.cancel = true
                resolve(orderItems)
            } else {
                resolve(orderItems)
            }
        })
    },
    getOrderedDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderedDetails = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })
            if(orderedDetails.couponDiscount>0){
                orderedDetails.discount =true
            }
            if (orderedDetails.paymentMethod == 'razorpayPayment') {
                orderedDetails.RazorPay = true
                resolve(orderedDetails)
            } else {
                resolve(orderedDetails)
            }

        })

    },
    getAdminOrderedDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderedDetails = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })
            if(orderedDetails.couponDiscount>0){
                orderedDetails.discount =true
            }
            if (orderedDetails.status == 'failed') {
                orderedDetails.pending = true
                resolve(orderedDetails)
            } else {
                resolve(orderedDetails)
            }

        })

    },
    generateRazorpay: (orderId, total) => {
        return new Promise(async (resolve, reject) => {
            var options = {
                amount: total * 100, //amount in the smallest currency
                currency: 'INR',
                receipt: orderId.toString()
            }
            instance.orders.create(options, function (error, order) {
                if (error) {
                    console.log("Error", error);
                } else {
                    resolve(order)
                }
            })
        })

    },
    verifyPayment: (details) => {

        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'oPa27Ld5aUAp26pdCd9OngAv')

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                console.log('same')
                resolve()
            }
            else {
                console.log('no match')
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: ObjectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }).then(() => {
                        resolve()
                    })
        })
    },

    getAllOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray();
             

            resolve(orders)
        })

    },
    getOrderCollection: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray();
            // console.log(orders);
            resolve(orders)
        })
    },

    changeOrderStatus: (data) => {
        // console.log(data);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: ObjectId(data.orderId), 'products.item': ObjectId(data.proId) },
                    {
                        $set: {
                            'products.$.status': data.status
                        }
                    }).then((response) => {
                        resolve(response)
                    })
        })
    },
    getOneOrderedDetails: (orderId, proId) => {
        return new Promise(async (resolve, reject) => {
            let orderedDetails = await db.get().collection(collection.ORDER_COLLECTION).findOne({ $and: [{ _id: ObjectId(orderId) }, { 'products.item': ObjectId(proId) }] })
            resolve(orderedDetails)
        })
    },
    cancelSingleOrderProduct: (orderId, proId, subtotal, totalAmount, couponPercent, reFund,proLength,orderCancelCount) => {
       
        orderCancelCount = parseInt(orderCancelCount)
        let OrderCancel = parseInt (orderCancelCount+1)
        subtotal = parseInt(subtotal)
        totalAmount = parseInt(totalAmount)
        couponPercent = parseInt(couponPercent)
        reFund = parseInt(reFund)
        totalAmount = (totalAmount - (subtotal * (1 - (couponPercent * 0.01)))).toFixed(0)
        let reFundtoBePaid = parseInt(subtotal*(1-(couponPercent * 0.01))+reFund).toFixed(0)
        let fund = parseInt(subtotal*(1-(couponPercent * 0.01))+reFund+40).toFixed(0)
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateMany({ _id: ObjectId(orderId), 'products.item': ObjectId(proId) },
                    {
                        $set: { totalAmountToBePaid: totalAmount, reFund: reFundtoBePaid , 'products.$.status': "Cancelled" },
                        $inc: {
                            orderCancelCount: 1
                        }
                    },
                ).then(async (response) => {
                    console.log(orderCancelCount);
                    console.log(OrderCancel);
                    if( OrderCancel == proLength) {
                        totalAmount = parseInt(totalAmount-40)
                       await db.get().collection(collection.ORDER_COLLECTION)
                        .updateOne({ _id: ObjectId(orderId)},
                        {
                            $set: { totalAmountToBePaid: totalAmount, reFund: fund}
                        })
                    }
                    resolve(response)
                })
        })

    }
}
