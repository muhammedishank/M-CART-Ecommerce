const db = require('../config/connections')
const collection = require('../config/collections')
const { status } = require('express/lib/response')

module.exports = {
  doLogin: (adminData) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      const response = {}
      const ADM = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ $and: [{ admEmail: adminData.Email }, { admPassword: adminData.Password }] })

      if (ADM) {

        response.admin = ADM
        response.status = true
        console.log('Admin login true')
        resolve(response)
      } else {
        console.log('Admin login failed')

        resolve({ status: false })
      }
    })
  },
  salesReport: (data) => {
    let response = {}
    let { startDate, endDate } = data

    let d1, d2, text;
    if (!startDate || !endDate) {
      d1 = new Date();
      d1.setDate(d1.getDate() - 30);
      d2 = new Date();
      text = "For the Last 7 days";
    } else {
      d1 = new Date(startDate);
      d2 = new Date(endDate);
      text = `Between ${startDate} and ${endDate}`;
    }

    // Date wise sales report
    const date = new Date(Date.now());
    const month = date.toLocaleString("default", { month: "long" });

    return new Promise(async (resolve, reject) => {

      let salesReport = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

        {
          $match: {
            date: {
              $lt: d2,
              $gte: d1,
            },
          },
        },
        {
          $group: {
            _id: { $dayOfMonth: "$date" },
            total: { $sum: "$totalAmountToBePaid" },
          },
        },
      ]).toArray();
      console.log(salesReport, 'salesReport');
      
      let pendingAmount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

        {
          $match: {
            status:'failed'
            },
          
        },
        {
          $group: {
            _id: null,
            totalPendingFund: { $sum: "$totalAmountToBePaid" },
          },
        },
      ]).toArray();
     
      let brandReport = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
        $unwind: "$products",
      }, {
        $project: {
          brand: "$products.brand",
          quantity: "$products.quantity"
        }
      }, {
        $group: {
          _id: '$brand',
          totalAmount: { $sum: "$quantity" },

        }
      }

      ]).toArray()

      console.log(brandReport, 'brandReport');

      let orderCount = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gt: d1, $lt: d2 } }).count()
      console.log(orderCount, 'orderCount');

      let totalAmounts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $group:
          {
            _id: null,
            totalAmount: { $sum: "$totalAmountPaid" }
          }
        }
      ]).toArray()

      let totalAmountRefund = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $group:  
          
          {
            _id: null,
            totalAmount: {
              $sum: { $toInt: '$reFund' }
            }
          }
        }
      ]).toArray()
    
      if(pendingAmount.length>0){
        response.pendingAmount = pendingAmount[0].totalPendingFund
      } else{
        response.pendingAmount = 0
      }
      // response.pendingAmount = pendingAmount[0].totalPendingFund
      response.salesReport = salesReport
      response.brandReport = brandReport
      response.orderCount = orderCount
      response.totalAmountPaid = totalAmounts[0].totalAmount
      response.totalAmountRefund = totalAmountRefund[0].totalAmount
      resolve(response)
    })

  }
}
