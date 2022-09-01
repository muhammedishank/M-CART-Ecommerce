# M-CART-Ecommerce

## Table of contents

- [Introduction](#introduction)
- [Demo](#demo)
- [Run](#run)
- [Technology](#technology)
- [Features](#features)
- [License](#license)

## Introduction

A virtual ecommerce website using Node js, Express js, and MongoDb.

NOTE: Please read the RUN section before opening an issue.

## Demo

![screenshot](mcart.png)

The application is deployed to AWS and can be accessed through the following link:

[mcarts.today on AWS](https://mcarts.today/)

The website resembles a real store and you can add products to your cart and wishlist and pay for them. If you want to try the checkout process, you can use the dummy card number/ upi/ Internet Bankinng provided by Razorpay for testing . Please <u><b>DO NOT</b></u> provide real card number and data.

In order to access the admin panel on "/admin" you need to provide the admin email and password.


## Run

To run this application, you have to set your own environmental variables. For security reasons, some variables have been hidden from view and used as environmental variables with the help of dotenv package. Below are the variables that you need to set in order to run the application:

- KEY_ID:     This is the razorpay key_Id (string).

- KEY_SECRET:  This is the razorpay key_Secret (string).

- TWILIO_SERVICE_ID: This is the Twilio Service Id (string).

- TWILIO_ACCOUNT_SID: This is the Twilio accountSID (string).

- TWILIO_AUTH_TOKEN: This is the Twilio AuthToken (string).

- NODE MAILER_email:This is the email id(string)

- NODE MAILER-password : This is the password(String)

- PORT: Specify the port Number

After you've set these environmental variables in the .env file at the root of the project, and intsall node modules using  `npm install`

Now you can run `npm start` in the terminal and the application should work.

## Technology

The application is built with:

- Node.js 
- Twilio
- Node mailer
- MongoDB
- Express 
- Bootstrap 
- AJAX
- JQuery
- Razorpay
- SweetAlert

Deployed in AWS EC2 instance with Nginx reverse proxy

## Features

The application displays a virtual phones and laptops store that contains virtual products and its information.

Users can do the following:

- Login and signup with OTP verification using twilio
-Through otp verification, the user can manage forgotten passwords
- Products can be viewed from landing page with categories and Offer price
- User can Add product to wish list
- User can view single product details
- Cart with subtotal and grand Total
- Can Add multiple address including shipping address
- Category wise render of all products
- Product search also needed products can be filtered out
- Payment Gateway is integrated with RAZOR PAY
- User can apply coupen before final billing
- User can track the purchased products
- The user can cancel the purchased products and the payment is refundable
- Status update of tracking is showed on order details
- Users can download an invoice of the orders

Admins can do the following:

- Admin login with pre defined credentials
- Admin Dashboard is implemented with sales report and brand report
- Admin can handle user block , unblock and delete
- Can add product and change product details
- Can add category and sub categories
- Admin can manage order details and product details

## License

[![License](https://img.shields.io/:License-MIT-blue.svg?style=flat-square)](http://badges.mit-license.org)

- MIT License
- Copyright 2022 © [Muhammed Ishan K](https://github.com/muhammedishank)
