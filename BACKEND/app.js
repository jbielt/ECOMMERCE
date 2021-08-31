require('dotenv/config');
const api = process.env.API_URL;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

//enable CORS
app.use(cors());
app.options('*', cors());

//Middlewares
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads')); //fem static el path indicat
app.use(errorHandler);


//Routes
const productsRoutes = require('./routers/products');
const categoriesRoutes = require('./routers/categories');
const usersRoutes = require('./routers/users');
const ordersRoutes = require('./routers/orders');

app.use(`${api}/products`, productsRoutes);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);


//connexió a la bdd (mongodb)
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'eshop-database'
})
    .then(()=>{
        console.log('Database Connection is ready...')
    })
    .catch((err)=>{
        console.log(err);
    })

//Servidor
app.listen(3000, ()=>{
    console.log('server is running http://localhost:3000');
})
