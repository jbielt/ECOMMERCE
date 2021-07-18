const {Order} = require('../models/order');
const express = require('express');
const router = express.Router();
const {OrderItem}= require('../models/order-item');


// GET ALL ORDERS + user name + ordered by date new to old
router.get(`/`, async (req, res) =>{
    const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});
    if(!orderList){
        res.status(500).json({success: false});
    }
    res.send(orderList);
})

//GET ORDER BY ID (obtenim el nom de l'usuari, i el objecte producte dins daquest, i el objecte categoria dins de producte (inner join)
router.get(`/:id`, async (req, res) =>{
    const orderList = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', populate: {
                path: 'product', populate: 'category'}
        });
    if(!orderList){
        res.status(500).json({success: false});
    }
    res.send(orderList);
})

//CREATE order (we need to create the orderItems before to assign it inside the order)
router.post('/', async(req,res)=>{
    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }))
    const orderItemsIdsResolved = await orderItemsIds;
    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: req.body.totalPrice,
        user: req.body.user
    })
    order = await order.save();
    if(!order){
        return res.status(404).send('The order cannot be created!');
    }
    res.send(order);
})


// EDIT ORDER (UPDATE ORDER STATUS)
router.put('/:id', async(req, res)=>{
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        { new: true }
    )
    if(!order){
        return res.status(400).send('The order status cannot be updated!');
    }
    res.send(order);
})


//DELETE ORDER(the order-tems from the order has to be deleted)
router.delete('/:id', (req, res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "order not found!"})
        }
    }).catch(err=>{
        return res.status(500).json({success: false, error: err})
    })
})
module.exports = router;
