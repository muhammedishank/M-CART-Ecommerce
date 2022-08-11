const db = require('../config/connections')
const collection = require('../config/collections')
const { PRODUCT_COLLECTION } = require('../config/collections')
const { response } = require('../app')
const ObjectId = require('mongodb').ObjectId

module.exports = {
    addtoWishlist: (proId, userId) => {
        let proObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            const userCart = await db.get().collection(collection.WISHLIST_COLLECTION)
                .findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products
                    .findIndex(product => product.item == proId)
                // console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: ObjectId(userId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then((response) => {
                            resolve(response)
                        })
                }
            } else {
                const wishObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    wishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            const wishList = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
            if (wishList) {
                count = wishList.products.length
            }
            resolve(count)
        })
    },
    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            const wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
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
                }
            ]).toArray()
            resolve(wishlistItems)
        })
    },
    deleteProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne({ _id: ObjectId(details.wishlist) },
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

    }
}