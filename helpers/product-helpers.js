const db = require('../config/connections')
const collection = require('../config/collections');
const bcrypt = require('bcrypt');
const async = require('hbs/lib/async');
const { reject } = require('bcrypt/promises');
const { status } = require('express/lib/response');
const nodemailer = require('nodemailer');
const { response } = require('../app');
const ObjectId = require('mongodb').ObjectId
const Multer = ('../middleware/multer')



module.exports = {
    addProduct: (productData) => {       
         productData.Prize = parseInt(productData.Prize)
         productData.currentPrize = parseInt(productData.currentPrize)
         productData.Stock = parseInt(productData.Stock)
         productData.Prize = (productData.currentPrize) - (productData.currentPrize*productData.Offer*0.01).toFixed(0)
        return new Promise(async (resolve, reject) => {
            // console.log(productData);          
            await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(productData).then((result) => {
                resolve(result.insertedId)
            })
        })
    },
    addImage: (prodId, img1, img2, img3, img4) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                { _id: ObjectId(prodId) },
                {
                    $set: {
                        image: [
                            { images: img1 },
                            { images1: img2 },
                            { images2: img3 },
                            { images3: img4 },
                        ],
                    },
                }, { upsert: true }
            ).then((response) => {
                resolve(response);

            });

        });

    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
            // console.log(products);
        })
    },
   
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).remove({ _id: ObjectId(proId) }).then((response) => {
                //console.log(response);
                resolve(response)
            })
        })
    },
    productDetail: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(proId) }).then((prod) => {
                resolve(prod)
            })
        })
    },
    //getOneProductDetails
    getOneProductDetails: (proId) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(proId) })
            resolve(product)
        })
    },
    editProduct: (productData, proId, img1, img2, img3, img4) => {
        productData.Prize = parseInt(productData.Prize)
        productData.Stock = parseInt(productData.Stock)
        productData.currentPrize = parseInt(productData.currentPrize)
        productData.Prize = parseInt(productData.currentPrize) - (productData.currentPrize*productData.Offer*0.01).toFixed(0)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(proId) },
                {
                    $set: {
                        Product: productData.Product,
                        Discription: productData.Discription,
                        Brand: productData.Brand,
                        Color: productData.Color,
                        Prize: productData.Prize,
                        currentPrize: productData.currentPrize,
                        Offer:productData.Offer,
                        Stock: productData.Stock,
                        Category:productData.Category,
                        Brand:productData.Brand,
                        Ram:productData.Ram,
                        Version:productData.Version,
                        Warrenty:productData.Warrenty,
                        Battery:productData.Battery,
                        Processor:productData.Processor,
                        InBox:productData.InBox,
                        Display:productData.Display,
                        frontCamara:productData.frontCamara,
                        backCamara:productData.backCamara,
                        image: [
                            { images: img1 },
                            { images1: img2 },
                            { images2: img3 },
                            { images3: img4 },
                        ],
                        date: new Date()
                    }
                })
                .then((response) => {
                    resolve(response)
                })
        })
    },
    addCategory:(data)=>{
        return new Promise(async (resolve, reject) => {
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne({ category:data.category,date:new Date()}).then((response)=>{
            resolve(response)
        })
    })
    },
    getAllCategory:() => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((categories)=>{
                resolve(categories)
            })
        })

    },
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).remove({ _id: ObjectId(catId) }).then((response) => {
                resolve(response)
            })
        })
    },
    addBrand:(data,img)=>{
        return new Promise(async (resolve, reject) => {
        db.get().collection(collection.BRAND_COLLECTION).insertOne(
            { 
                brand:data.brand,
                logo:img,
                date:new Date()
            }
            ).then((response)=>{
            resolve(response)
        }) 
    })
    },
    getAllBrands:() => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).find().toArray().then((brands)=>{
                resolve(brands)
            })
        })

    },
    getOneBrands:(id) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).findOne({_id:ObjectId(id)}).then((brand)=>{
                resolve(brand)
            })
        })

    },
    editBrand: (data,img)=>{
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).updateOne({ _id: ObjectId(data.brandId) },
                {
                    $set: {
                       brand:data.brand,
                        logo: img  ,          
                        
                        date: new Date()
                    }
                })
                .then((response) => {
                    resolve(response)
                })
        })
    },
    deleteBrand: (brandId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).remove({ _id: ObjectId(brandId) }).then((response) => {
                resolve(response)
            })
        })
    },
    //getSearchProducts
  getSearchProducts: (key) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({
          $or: [
            { Product: { $regex: new RegExp("^" + key + ".*", "i") } },
            { Brand: { $regex: new RegExp("^" + key + ".*", "i") } },
            { Category: { $regex: new RegExp("^" + key + ".*", "i") } },
          ],
        })
        .toArray();
      resolve(products);
    });
  },
  
}

