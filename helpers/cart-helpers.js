const db = require('../config/connections')
const collection = require('../config/collections')
const { PRODUCT_COLLECTION } = require('../config/collections')
const { response } = require('../app')
const ObjectId = require('mongodb').ObjectId

module.exports = {
    addtoCart: (proId, userId, brand) => {

        let proObj = {
            item: ObjectId(proId),
            quantity: 1,
            status: "Ordered",
            brand: brand

        }
        return new Promise(async (resolve, reject) => {
            const userCart = await db.get().collection(collection.CART_COLLECTION)
                .findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products
                    .findIndex(product => product.item == proId)
                // console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            },

                        ).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then((response) => {
                            resolve(response)
                        })
                }
            } else {
                const cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            const cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {

                        item: '$products.item',
                        quantity: '$products.quantity',
                        subtotal: '$products.subtotal'
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
                        subtotal: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    cartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            const cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise(async (resolve, reject) => {
            const cart = await db.get().collection(collection.CART_COLLECTION).findOne({ _id: ObjectId(details.cart) })

            const product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(details.product) })

            if (cart) {
                if (details.quantity >= product.Stock && details.count == 1) {
                    resolve({ error: true })
                } else {
                    if (details.count == -1 && details.quantity == 1) {
                        db.get().collection(collection.CART_COLLECTION)
                            .updateOne({ _id: ObjectId(details.cart) },
                                {
                                    // $pull : for removing that product
                                    $pull: {
                                        products: { item: ObjectId(details.product) }
                                    }
                                }
                            ).then((response) => {
                                resolve({ removeProduct: true })
                            })
                    } else {
                        db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                            {
                                $inc: {
                                    'products.$.quantity': details.count,

                                }
                            }
                        ).then((response) => {
                            resolve({ status: true })
                        })
                    }
                }
            }
        })
    },
    deleteProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: ObjectId(details.cart) },
                    {
                        // $pull : for removing that product
                        $pull: {
                            products: { item: ObjectId(details.product) }
                        }
                    }
                ).then((response) => {
                    resolve({ response })
                })
        })

    },
    getTotalAmountForOneProduct: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            let subtotal = await db
                .get().collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            user: ObjectId(userId),
                        },
                    },
                    {
                        $unwind: "$products",
                    },
                    {
                        $project: {
                            item: "$products.item",
                            quantity: "$products.quantity",
                        },
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: "item",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $match: {
                            item: ObjectId(proId),
                        },
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ["$product", 0] },
                        },
                    },
                    {
                        $project: {
                            unitPrice: { $toInt: "$product.Prize" },
                            quantity: { $toInt: "$quantity" },
                        },
                    },
                    {
                        $project: {
                            _id: null,
                            subtotal: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
                        },
                    },
                ])
                .toArray();
            if (subtotal.length > 0) {
                db.get()
                    .collection(collection.CART_COLLECTION)
                    .updateOne(
                        { user: ObjectId(userId), "products.item": ObjectId(proId) },
                        {
                            $set: {
                                "products.$.subtotal": subtotal[0].subtotal,
                            },
                        }
                    )
                    .then((response) => {
                        console.log(response);
                        resolve(subtotal[0].subtotal);
                    });
            } else {
                subtotal = 0;
                resolve(subtotal);
            }
        })
    },
    changeCartSubtotal: (details) => {
        count = parseInt(details.count)
        quantity = parseInt(details.quantity)
        price = parseInt(details.price)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {

                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })
            }
            else {
                let subtotal = price * (quantity + count)
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                    {
                        $set: { 'products.$.subtotal': subtotal }
                    }).then((response) => {
                        console.log(response);
                        resolve()
                    })
            }
        })
    },
}