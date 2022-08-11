const db = require('../config/connections')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { status } = require('express/lib/response')
const nodemailer = require('nodemailer')
const { response } = require('../app')
const ObjectId = require('mongodb').ObjectId

require('dotenv').config()
const otpemail = process.env.otpemail
const otpemailPass = process.env.otpemailPass

module.exports = {
    doSignup: (userData) => {
        console.log(userData);
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            userData.cnfmpassword = await bcrypt.hash(userData.cnfmpassword, 10)

            // here email=alredy mongodb email ,& userData.email= new user enetring email
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                // eslint-disable-next-line prefer-promise-reject-errors
                reject({ status: false, msg: 'Email already taken' })
            } else {
                console.log(userData);
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((response) => {
                    const toEmail = userData.email
                    // for mail send after signup
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: otpemail,
                            pass: otpemailPass
                        }
                    })
                    transporter.sendMail({
                        from: otpemail,
                        to: toEmail,
                        subject: 'Regarding forget password request',
                        text: 'This is forget password response from your app',
                        html: '<p>Welcometo <b>M-CART</b></p>'
                    }, function (error, response) {
                        if (error) {
                            console.log('Failed in sending mail')
                        } else {
                            console.log('Successful in sending email')
                        }
                    })
                })

                resolve({ status: true })
            }
        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.Email })
            //console.log(userData.Password);
            // console.log(user.Password);
            if (user) {
                bcrypt.compare(userData.Password, user.password).then((status) => {
                    if (status) {
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');
                        resolve({ status: false })
                    }
                })

            } else {
                console.log('login FAILED @2');
                resolve({ status: false })
            }
        })
    },
    doForget: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobnumber: userData.fgphnum })
            if (user) {
                response.status = true
                resolve(response)
            } else {
                response.status = false
                resolve(response)
            }
        })
    },
    doEdit: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.fgPassword = await bcrypt.hash(userData.fgPassword, 10)
            userData.fgCpassword = await bcrypt.hash(userData.fgCpassword, 10)

            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobnumber: userData.fgMobile })
            if (user) {
                db.get().collection(collection.USER_COLLECTION).updateOne({ mobnumber: userData.fgMobile }, {
                    $set: { password: userData.fgPassword, cpassword: userData.fgCpassword }
                }).then((details) => {
                    response.user = details
                    response.status = true
                    resolve(response)
                })
            } else {
                resolve({ status: false })
            }
        })
    },
    getAllusers: () => {
        return new Promise(async (resolve, reject) => {
            let User = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(User)
        })
    },
    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let User = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            if (User) {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, { $set: { block: true } }, { upsert: true })
                //  console.log(User);
                resolve(User)
            }
        })
    },
    getUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let User = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            console.log(User);
            resolve(User)
        })
    },
    unblockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let User = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            if (User) {
                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, { $set: { block: false } }, { upsert: true })
                resolve(User.name)
            }
        })
    },
    blockedUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            const User = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            if (User) {
                resolve(User.name)
            }
        })
    },
    deleteUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).remove({ _id: ObjectId(userId) }).then((response) => {
                //console.log(response);
                resolve(response)
            })
        })
    },

    // user profile section
    editUserAddress:(userId, data) =>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id: ObjectId(userId)},
            {
                $set:{
                    name: data.name,
                    email: data.email
                }
            }).then((response) =>{
                resolve(response)
            })
        })
    },
    updateUserDetails: (userId, details) => {
        let address = {
            fname: details.fname,
            lname: details.lname,
            house: details.house,
            localplace: details.localplace,
            town: details.towncity,
            district: details.district,
            state: details.state,
            pincode: details.pincode,
            email: details.email,
            mobile: details.mobile,
            id: details.fname + new Date()
        }

        return new Promise((resolve, reject) => {

            let user = db.get().collection(collection.USER_COLLECTION)
                .findOne({ _id: ObjectId(userId) })

            // if (user.addresses) {
            //     db.get().collection(collection.USER_COLLECTION)
            // //         .updateOne({ _id: ObjectId(userId) },
            //             {
            //                 $push: { addresses: address }
            //             }).then((response) => {
            //                 resolve(response)
            //             })
            // } else {
                db.get().collection(collection.USER_COLLECTION)
                    .updateOne({ _id: ObjectId(userId) },
                        {
                            $push: { addresses: address }
                        }).then((response) => {
                            resolve(response)
                        })
            
        })
    },
    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            resolve(user.addresses)
        })
    },
    getOneAddress: (AddressId, userId) => {
        return new Promise(async (resolve, reject) => {
            const address = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(userId) }
                },
                {
                    $unwind: '$addresses'
                },
                {
                    $match: { 'addresses.id': AddressId }
                },
                {
                    $project: {
                        addresses: 1,
                        _id: 0
                    }
                }
            ]).toArray()

            resolve(address[0].addresses)

        })
    },
    editAddress:(AddressId,userId,data) => {
        
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({ _id:ObjectId(userId), 'addresses.id':AddressId},
            {
                $set: {
                    "addresses.$.fname": data.fname,
                    "addresses.$.lname": data.lname,
                    "addresses.$.house": data.house,
                    "addresses.$.localplace": data.localplace,
                    "addresses.$.town": data.towncity,
                    "addresses.$.district": data.district,
                    "addresses.$.state": data.state,
                    "addresses.$.pincode": data.pincode,
                    "addresses.$.mobile": data.mobile,
                    "addresses.$.email": data.email
                }
            }
            ).then((response) =>{
            resolve(response)  
            })            
        })
    },
    deleteAddress:(AddressId, userId) =>{
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({ _id:ObjectId(userId), 'addresses.id':AddressId },
            {
                $pull: { 'addresses': {id:AddressId} }
            }
            ).then((response) =>{
            resolve(response)  
            })            
        })
    },
    
}