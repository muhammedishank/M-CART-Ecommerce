const db = require('../config/connections')
const collection = require('../config/collections')
const { PRODUCT_COLLECTION } = require('../config/collections')
const { response } = require('../app')
const ObjectId = require('mongodb').ObjectId

module.exports = {
    getAllhomeProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(6).toArray()
            resolve(products)
            // console.log(products);
        })
    },
    GetNewarrivals: () => {
        return new Promise(async (resolve, reject) => {
            let newProducts = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({date:-1}). limit(4).toArray()
            resolve(newProducts)
        })
    },
    Newarrivals: () => {
        return new Promise(async (resolve, reject) => {
            let newProducts = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({date:-1}). toArray()
            resolve(newProducts)
        })
    },


    // searchFilter: (brandFilter, cateFilter, price) => {
    //     return new Promise(async (resolve, reject) => {
    //       let result;
    //       console.log(brandFilter);
    //       if (brandFilter.length > 0 && cateFilter.length > 0) {
    //         result = await db
    //           .get()
    //           .collection(collection.PRODUCT_COLLECTION)
    //           .aggregate([
    //             {
    //               $match: { $or: brandFilter },
    //             },
    //             {
    //               $match: { $or: cateFilter },
    //             },
    //             {
    //               $match: { price: { $lt: price } },
    //             },
    //           ])
    //           .toArray();
    //       } else if (brandFilter.length > 0 && cateFilter.length == 0) {
    //         result = await db
    //           .get()
    //           .collection(collection.PRODUCT_COLLECTION)
    //           .aggregate([
    //             {
    //               $match: { $or: brandFilter },
    //             },
    //             {
    //               $match: { price: { $lt: price } },
    //             },
    //           ])
    //           .toArray();
    //       } else if (brandFilter.length == 0 && cateFilter.length > 0)
    //         result = await db
    //           .get()
    //           .collection(collection.PRODUCT_COLLECTION)
    //           .aggregate([
    //             {
    //               $match: { $or: cateFilter },
    //             },
    //             {
    //               $match: { price: { $lt: price } },
    //             },
    //           ])
    //           .toArray();
    //       else {
    //         result = await db
    //           .get()
    //           .collection(collection.PRODUCT_COLLECTION)
    //           .aggregate([
    //             {
    //               $match: { price: { $lt: price } },
    //             },
    //           ])
    //           .toArray();
    //       }
    //       console.log(result);
    //       resolve(result);
    //     });
    //   },


    searchFilter :(brandFilter, cateFilter, price) => {
        return new Promise(async (resolve, reject) => {
            let result
            if (brandFilter.length > 0 && cateFilter.length > 0) {
                result = await db
                  .get()
                  .collection(collection.PRODUCT_COLLECTION)
                  .aggregate([
                    {
                      $match: { $or: brandFilter },
                    },
                    {
                      $match: { $or: cateFilter },
                    },
                    {
                        $match:{Prize:{$lt:price}}
                    },
                  ])
                  .toArray();
                } else if (brandFilter.length > 0 && cateFilter.length == 0) {
                    result = await db
                      .get()
                      .collection(collection.PRODUCT_COLLECTION)
                      .aggregate([
                        {
                          $match: { $or: brandFilter },
                        },
                        {
                            $match:{Prize:{$lt:price}}
                        },
                      ])
                      .toArray();
                  } else if (brandFilter.length == 0 && cateFilter.length > 0)
                    result = await db
                      .get()
                      .collection(collection.PRODUCT_COLLECTION)
                      .aggregate([
                        {
                          $match: { $or: cateFilter },
                        },
                        {
                            $match:{Prize:{$lt:price}}
                        },
                      ])
                      .toArray();
                  else {
                    result = await db
                      .get()
                      .collection(collection.PRODUCT_COLLECTION)
                      .aggregate([
                        {
                            $match:{Prize:{$lt:price}}
                        },
                      ])
                      .toArray();
                  }
                  resolve(result);
            // if (filter.length>0){
            //      result = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
            //         {
            //             $match:{ $or:filter}
            //         },
            //         {
            //             $match:{Prize:{$lt:price}}
            //         }
            //     ]).toArray() 
            // } else{
            //      result = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    
            //         {
            //             $match:{Prize:{$lt:price}}
            //         }
            //     ]).toArray()
            // }
            
            // //  console.log("",result);
            // resolve(result)
        })
      },
      getAllbrand:()=>{
        return new Promise(async (resolve, reject) => {
            let brands = await db.get().collection(collection.BRAND_COLLECTION).find().toArray()
            resolve(brands)
        })
      },
      getAllcategory:()=>{
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })
      },
      getOneBrand :(brandName) =>{
        return new Promise(async (resolve, reject) => {
            let brand = await db.get().collection(collection.PRODUCT_COLLECTION).find({Brand:brandName}).toArray()
            resolve(brand)
        })
      }
}