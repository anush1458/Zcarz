const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const shortid = require('shortid');

const User = require('../models/user');
const Order = require('../models/order');

const transport = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_user: process.env.SENDGRID_API_KEY
    }
}))

const razorpayInstance = new Razorpay({
  
    // Replace with your key_id
    key_id: "rzp_test_4qPTM5GMllbbGk",
  
    // Replace with your key_secret
    key_secret: "L1Q7HwpIcY4CI4xloNHRmcXD"
});

//Send invoice by checkout
const sendInvoiceEmail = async ( req, res ) => {

    const { orderId } = req.body
    let user
    try{
        user = await User.findById(req.params.id).populate('orders');
    }catch(err){
        console.log(err);
        res.status(500).send({msg: 'Server Error, could not find a user with that id'})
    }

    if(!user){
        return res.status(403).json({ msg: 'No users account with that id'});
    }

    let emailOrder
    try {
        emailOrder = await Order.findById({_id: orderId})
    }catch(err){
         console.log(err);
         res.status(500).send({ msg: 'We can not send that e-mail'})
     }
    
     if(!emailOrder){
        return res.json({ msg: 'No order with this id'});
    }

    const firstName = emailOrder.firstName;
    const lastName = emailOrder.lastName;
    const totalPrice = (emailOrder.totalPrice).toFixed(2);
    const carName = emailOrder.name;
    const carModel = emailOrder.model;
    const startDate = new Date(emailOrder.startDate).toLocaleDateString('de-DE');
    const endDate = new Date(emailOrder.endDate).toLocaleDateString('de-DE');
    const totalDays = emailOrder.totalDays;

    try{
        transport.sendMail({
            to: user.email,
            from: 'anushmohammed1202@gmail.com',
            subject: 'Your Rent Incoice',
            html: `<h3>This is your Rent Invoice</h3>
            </br>
            <h4> Dear ${firstName} ${lastName}</h4>
            <p>You have rented ${carName} ${carModel}</p>
            <p>for total ${totalDays} days - starting from ${startDate} to ${endDate}</p>
            <h3>Your total rent price is ${totalPrice} Euro</h3>
            </br>
            <P>We are very happy, that you choose us</p>`
        })
        res.send('Email sent!')
    }catch(err){
        console.log(err);
        res.status(500).send({ msg: 'We can not send that e-mail'})
        
    }
}

//Send reset passowrd link
const resetPassword = async ( req, res ) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({ msg: 'Invalid input, please check your data' });
    }
    
    //Generate token
    let token
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err)
        }
    token = buffer.toString('hex');       
    });

    let user
    try{
        user = await User.findOne({email: req.body.email});
    }catch(err){
        console.log(err);
        res.status(500).send({msg: 'Server Error, could not find a user with that email'});
    };

    if(!user){
        return res.status(403).json({ msg: 'No account with that e-mail'});
    };

    try{
        user.resetToken = token;
        //1h time exp time for generated token
        user.expToken = Date.now() + 3600000;
        await user.save();
    }catch(err){
        console.log(err);
        res.status(500).send({ msg: 'Server error, can not update user'});
    }

    try{
        transport.sendMail({
            to: req.body.email,
            from: 'anushmohammed1202@gmail.com',
            subject: 'Password reset',
            html: `<h3>This is your Password reset link</h3>
            <P>Click the <a href="http://localhost:3000/auth/reset/${token}">link</a> to reset your password and create a new one</p>
            <p>The key will expired after 1 hour</p>
            </br/
            <h3>Thank you for choosing us</h3>`
        })
        res.send('Email sent!');
    }catch(err){
        console.log(err);
        res.status(500).send({ msg: 'We can not send that e-mail'});
    }
};

const razorPayCreateOrder = async(req,res)=>{

    console.log('request came here')

    console.log(req.params.id);

    const orderId = req.params.id;
    let emailOrder;
    try {
        emailOrder = await Order.findById({_id: orderId})
    }catch(err){
         console.log(err);
         res.status(500).send({ msg: 'We can not send that e-mail'})
     }

    const payment_capture = 1;
    const amount = (emailOrder.totalPrice).toFixed(2);
    const currency = "INR";
    console.log("amount"+ amount);
    const options = {
      amount: amount * 100,
      currency,
      receipt: shortid.generate(),
      payment_capture,
    };
    
    try {
        const response = await razorpayInstance.orders.create(options);
        console.log(response);
        res.json({
          id: response.id,
          currency: response.currency,
          amount: response.amount,
        });
      } catch (error) {
        console.log(error);
      }
    
}

exports.sendInvoiceEmail = sendInvoiceEmail;
exports.razorPayCreateOrder = razorPayCreateOrder;
exports.resetPassword = resetPassword;