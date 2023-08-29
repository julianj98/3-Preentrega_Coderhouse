import dotenv from 'dotenv';
import express, { urlencoded } from 'express';
import products from "./routes/products.router.js"
import carts from "./routes/carts.router.js"
import viewsRouter from "./routes/views.router.js";
import handlebars from "express-handlebars";
import __dirname from "./utils.js";
import {Server} from "socket.io"
import { createServer } from 'http';
import ProductManager from "./dao/filesystem/manager/ProductManager.js";
import mongoose from 'mongoose'
import Message from './dao/mongo/models/message.js';
import Handlebars from 'handlebars';
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access';
import MongoStore from "connect-mongo";
import session from "express-session";
import sessionsRouter from "./routes/session.router.js";
import passport from "passport";
import initializePassport from "./config/passport.config.js";
import isUser from './middlewares/isUser.js';
//defino dotenv y las constantes del .env

dotenv.config();
const mongoUrl = process.env.MONGO_URL;
const sessionSecret = process.env.SESSION_SECRET;

const hbs = handlebars.create({
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  helpers: {
    ifEquals: function (arg1, arg2, options) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    },
  },
});

const app = express();

const connection = await mongoose.connect(mongoUrl)
const httpServer = createServer(app);
const io = new Server(httpServer);
const productManager = new ProductManager();

app.use(
  session({
    store: new MongoStore({
      mongoUrl,
      ttl: 3600,
    }),
    secret:sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.json());
app.use(urlencoded({ extended: true }))
app.use('/api/products',products);
app.use('/api/carts',carts);

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
initializePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use("/",viewsRouter)
app.get('/filesystem', (req, res) => {
    const products = productManager.getProducts();
    res.render('home', { products });
  });


  app.get('/chat', isUser, async (req, res) => {
    const messages = await Message.find().lean();
    res.render('chat', { messages });
  });

io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');

  socket.on('message', async (data) => {
    const { user, message } = data;

  if (!user || user.trim() === '') {
    console.log('Error: el campo "user" es requerido');
    return;
  }

    // Guardar el mensaje en la colección "messages" en MongoDB
    const newMessage = new Message({ user, message });
    await newMessage.save();

    // Emitir el evento "messageLogs" a todos los clientes conectados
    const messages = await Message.find().lean();
    io.emit('messageLogs', messages);
  });


  });


const port = process.env.PORT || 8080;

  httpServer.listen(8080, () => {
    console.log(`Server is running on port ${port}` );
  });
  


app.use("/api/sessions", sessionsRouter);


export {io};
//http://localhost:8080/api/sessions/login para loguearse en postman y asi probar los permisos
//RUTAS DEL SISTEMA DE LOGIN pass admin adminCod3r123
//localhost:8080/api/sessions/current mostrara un JSON con los datos del usuario si esta logueado, sino devolvera un not authenticated
//localhost:8080/login
//localhost:8080/register
//localhost:8080/products (solo para usuario logueado, si trata de ingresar sin loguearse lo devuelve a la pagina de logueo)
//localhost:8080/profile (solo para usuario validado, si trata de ingresar sin loguearse lo devuelve a la pagina de logueo)
//tambien si quiere ingresar a localhost:8080 lo redirige a la pagina de login 

/** EJEMPLO PARA PROBAR EL POST
 * {
    "title": "producto prueba 16",
    "description": "Este es un producto prueba 16",
    "code": "abc16",
    "price": 300,
    "stock": 8000,
    "category": "cloth",
    "thumbnail": "sim imagen"
  } */
// Ids de los carts para testear : 64a3a064b2d2e5ac49890d81  - 64a3a068b2d2e5ac49890d83  - 64a3aa880490f829160e5326  - 64a7339672d853e16a2d2deb
//Vista de productos con paginacion: localhost:8080/products
//Vista de un carrito localhost:8080/carts/64a3a068b2d2e5ac49890d83  (el id se puede cambiar por cualquiera de arriba)

/*CONSULTAS AL ENDPOINT (reemplazar la x por el id)
para PRODUCTS
*varias consultas para GET
localhost:8080/api/products
localhost:8080/api/products?limit=5
localhost:8080/api/products?available=true
localhost:8080/api/products?query=tech
localhost:8080/api/products?available=true&sort=asc
localhost:8080/api/products/x
*POST
localhost:8080/api/products/
*PUT Y DELETE
localhost:8080/api/products/x

para CARTS
*POST
localhost:8080/api/carts
*GET
localhost:8080/api/carts/X
*POST de un product en un cart
localhost:8080/api/carts/x/product/x  
*DELETE de un producto del carrito
localhost:8080/api/carts/x/products/x
*DELETE de todos los productos del carrito
localhost:8080/api/carts/x
*PUT de actualizar el carrito con varios elementos
localhost:8080/api/carts/x
ejemplo del formato para el PUT
{
  "products": [
    {
      "product": "64ab86487d68fbafa138064a",
      "quantity": 2
    },
    {
      "product": "64ab89e569e6a1111faf8ae7",
      "quantity": 3
    },
    {
      "product": "64ab8dcc055f94746ff5ddba",
      "quantity": 1
    }
  ]
}
*PUT para actualizar solo la cantidad de un producto
localhost:8080/api/carts/x/products/x
{
  "quantity": 7
}*/
