const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// GET USERS (no mostra password)
router.get(`/`, async (req, res) =>{
    const userList = await User.find().select('-passwordHash');
    if(!userList){
        res.status(500).json({success: false});
    }
    res.send(userList);
})

// GET USERS ONLY NAME PHONE EMAIL
router.get(`/filteredDataUsers`, async (req, res) =>{
    const userList = await User.find().select('name phone email');
    if(!userList){
        res.status(500).json({success: false});
    }
    res.send(userList);
})

// GET USER BY ID (no password)
router.get('/:id', async (req, res)=>{
    const user = await User.findById(req.params.id).select('-passwordHash');
    if(!user){
        res.status(500).json({message: 'The user with the given ID was not found!'});
    }
    res.status(200).send(user);
})

// CREATE USER
router.post('/', async(req,res)=>{
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country
    })
    user = await user.save();
    if(!user){
        return res.status(404).send('The user cannot be created!');
    }
    res.send(user);
})

//UPDATE user
router.put('/:id', async(req, res)=>{
    //COMPROVEM SI modifiquem el password o no i depenent deixem el original o es canvia per el proposat.
    const userExists = await User.findById(req.params.id);
    let newPassword ;
    if(req.body.password){
        newPassword = bcrypt.hashSync(req.body.password,10);
    }else{
        newPassword = userExists.passwordHash;
    }
    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country
        },
        { new: true }
    )
    if(!user){
        return res.status(400).send('The category cannot be edited!');
    }
    res.send(user);
})

// LOGIN
router.post('/login', async (req,res)=>{
    const user = await User.findOne({email: req.body.email});
    const secret = process.env.secret;
    if(!user){
        return res.status(400).send('The user is not found!');
    }
    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)){
        //creem un token al fer login únic per a cada usuari al iniciar sessió i l'assignem a aquest
        const token = jwt.sign(
            {
                        userId: user.id,
                        isAdmin: user.isAdmin
                    },
                        secret,
            {
                    expiresIn: '1d'
                    }
        )
        res.status(200).send({user: user.email, token: token})
    }else{
        res.status(400).send('Password is wrong!')
    }
})

// REGISTER USER
router.post('/register', async(req,res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country
    })
    user = await user.save();
    if(!user){
        return res.status(404).send('The user cannot be registered!');
    }
    res.send(user);
})

// conta els usuaris
router.get(`/get/count`, async (req, res) =>{
    const userCount = await User.countDocuments((count)=>count);
    if(!userCount){
        res.status(500).json({success: false});
    }
    res.send({
        userCount: userCount
    });
})

// DELETE USERS
router.delete('/:id',(req,res)=>{
    User.findByIdAndRemove(req.params.id).then(user => {
        if(user){
            return res.status(200).json({success: true, message: 'The User is deleted!'});
        }else{
            return res.status(404).json({success: false, message:'User not found!'})
        }
    }).catch(err=>{
        //We send the error to the client (error general 400)
        return res.status(400).json({success: false, error: err});
    })
})



module.exports = router;
