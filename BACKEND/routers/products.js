const {Product} = require('../models/product');
const {Category} = require('../models/category');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

//Extensions valides per a pujar imatges
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

//utilitza la llibreria multer per pujar imatges ( mirar docu)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type');
        if(isValid){
            uploadError = null;
        }
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        console.log(fileName)
        const extension = FILE_TYPE_MAP[file.mimetype];
        console.log(extension)
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
});

const uploadOptions = multer({ storage: storage });



// es pot fer servir await + async, o .then, .catch
// petició GET per obtenir tots els productes (primer esperara a ser omplerta, i despres respondra amb la llista)
router.get(`/`, async (req, res) =>{
    // localhost:3000/api/v1/products?categories=2161651,189165
    let filter = {};
    if(req.query.categories){
        filter = {category: req.query.categories.split(",")}
    }
    //find() retorna tots, .select(columnes que voles retornar). (treure id) (exemple)
    const productList = await Product.find(filter).populate('category');
    if(!productList){
        res.status(500).json({success: false});
    }
    res.send(productList);
})

// FIND product BY ID
router.get(`/:id`, async (req, res) =>{
    //populate() conecta amb un altre taula amb la clau forana (exemple) (el id(ref) de categoria model.product
    const product = await Product.findById(req.params.id).populate('category');
    if(!product){
        res.status(500).json({success: false});
    }
    res.send(product);
})

// petició POST per afegir un producte (afegeix imatge) (UPLOAD 1 IMAGE OPTIONAL)
router.post(`/`, uploadOptions.single('image'), async (req, res) =>{
    const category = await Category.findById(req.body.category);
    if(!category){
        return res.status(400).send('Invalid Category!');
    }
    //validem si no pujen un arxiu
    const file = req.file;
    if(!file){
        return res.status(400).send('No image in the request!');
    }
    //Montem la ruta de pujada d'imatges
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    })

    product = await product.save();
    if(!product){
        return res.status(400).send('The product cannot be created!')
    }
    res.send(product);
})

// UPLOAD A GALLERY IMAGE
router.put('/gallery-images/:id', uploadOptions.array('images', 10), async(req, res)=>{
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(400).send('Invalid Product Id');
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    if(files){
        files.map(file => {
            imagesPaths.push(`${basePath}${file.filename}`);
        })
    }
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        { new: true }
    )
    if(!product){
        return res.status(400).send('The product cannot be edited!');
    }
    res.send(product);
})

//UPDATE product
router.put('/:id', uploadOptions.single('image'), async(req, res)=>{
    //validar el ID
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(400).send('Invalid Product Id');
    }
    //Comprovem que la categoria existeix abans d'inserir un producte
    const category = await Category.findById(req.body.category);
    if(!category){
        return res.status(400).send('Invalid Category!');
    }
    const product = await Product.findById(req.params.id);
    if(!product){
        return res.status(400).send('Invalid Product!');
    }
    const file = req.file;
    let imagePath;
    if(file){
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`;
    }else{
        imagePath = product.image;
    }
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        },
        //retorna el nou producte actualitzat al request
        { new: true }
    )
    if(!updatedProduct){
        return res.status(400).send('The product cannot be edited!');
    }
    res.send(updatedProduct);
})

// DELETE category
// api/v1/idCategory
router.delete('/:id',(req,res)=>{
    Product.findByIdAndRemove(req.params.id).then(product => {
        if(product){
            return res.status(200).json({success: true, message: 'The Product is deleted!'});
        }else{
            return res.status(404).json({success: false, message:'Product not found!'})
        }
    }).catch(err=>{
        //We send the error to the client (error general 400)
        return res.status(400).json({success: false, error: err});
    })
})

//Count documents on collection db (registres d'una taula) COUNT PRODUCTS
router.get(`/get/count`, async (req, res) =>{
    const productCount = await Product.countDocuments((count)=>count);
    if(!productCount){
        res.status(500).json({success: false});
    }
    res.send({
        count: productCount
    });
})

// GET only featured Products
router.get(`/get/featured`, async (req, res) =>{
    const featuredProducts = await Product.find({isFeatured: true});
    if(!featuredProducts){
        res.status(500).json({success: false});
    }
    res.send({
        count: featuredProducts
    });
})
//GET only featured Products LIMIT TO 5.
router.get(`/get/featured/:count`, async (req, res) =>{
    //limitar a 5 els resultats (vigilar req.params.count retorna un string i no un number!)
    const count = req.params.count ? req.params.count : 0;
    const featuredProducts = await Product.find({isFeatured: true}).limit(+count);
    if(!featuredProducts){
        res.status(500).json({success: false});
    }
    res.send({
        count: featuredProducts
    });
})



module.exports = router;
