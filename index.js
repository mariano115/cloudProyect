const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const numThreads = require('os').cpus().length;
const compression = require('compression');
const { getMensajes, addMensaje } = require("./Mensajes");
const { createUser } = require("./Users");
const {
  fakerProducts,
  auth,
  createHash
} = require("./utils");
const { Server: HttpServer } = require("http");
const { Server: IOServer } = require("socket.io");
const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
const cors = require("cors");
const Config = require("./config");
const cookieParser = require("cookie-parser");
const userModel = require("./models/User.model");
const MongoStore = require("connect-mongo");
const { isValidPassword, loggerDeclaration } = require("./utils");
const winston = require("winston");
const parseArgs = require("minimist");
const { fork } = require("child_process");

//loggers
const logger = loggerDeclaration()

//passport imports
const passport = require("passport");
const { Strategy } = require("passport-local");
const LocalStrategy = Strategy;

//servidor
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(express.json());
app.use(cors());

/*----------- Session -----------*/
app.use(cookieParser("secreto"));
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: Config.urlMongo,
      mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
    }),
    secret: Config.secretSession,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
  })
);

// motor de vistas
app.set("views", "./views");
app.set("view engine", "ejs");

io.on("connection", async (socket) => {
  await getMensajes().then((res) => socket.emit("messages", res));
  socket.emit("products", await fakerProducts(5));

  socket.on("new-message", async (data) => {
    await addMensaje({
      author: {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        edad: data.edad,
        alias: data.alias,
        avatar: data.avatar,
      },
      text: data.text,
    });
    io.sockets.emit("messages", await getMensajes());
  });

  socket.on("new-product", async (data) => {
    try {
      const products = await fakerProducts(5);
    products.push(data);
    io.sockets.emit("products", products);
    } catch (error) {
      logger.error('Fallo en la creacion de productos ', error)
      console.log(error);
    }
    
  });
});


//Puerto enviado por ARGS
/* const args = parseArgs(process.argv.slice(2)); */
const args = parseArgs(process.argv.slice(2), {default: {PORT: '8080'}})
/* // console.log(args.PORT) */
const PORT = args.PORT
/* const PORT = args._[0] || 8080; */

mongoose.connect(
  Config.urlMongo,
  {
    useNewUrlParser: true,
  },
  (err) => {
    if (err) throw new Error(`Error de conexión a la base de datos ${err}`);
    console.log("Base de datos conectada");
  }
);

//middlewares passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  "login",
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    (email, password, done) => {
      mongoose.connect(Config.urlMongo);
      try {
        userModel.findOne(
          {
            email,
          },
          (err, user) => {
            console.log(user);
            if (err) {
              return done(err, null);
            }

            if (!user) {
              return done(null, false);
            }

            if (!isValidPassword(user, password)) {
              return done(null, false);
            }

            return done(null, user);
          }
        );
      } catch (e) {
        return done(e, null);
      }
    }
  )
);

//serializar y deserializar

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  userModel.findById(id, function (err, user) {
    done(err, user);
  });
});

app.get("/", auth, (req, res) => {
  logger.info("Redireccion a ruta '/home' autenticacion Completada")
  res.redirect("/home");
});

app.post(
  "/login",
  passport.authenticate("login", {
    failureRedirect: "/login-error",
  }),
  (req, res) => {
    logger.info("Peticion POST a ruta '/login'")
    req.session.email = req.body.email;
    res.redirect("/home");
  }
);

app.get("/home", auth, (req, res) => {
  logger.info("Peticion GET a ruta '/home'")
  res.render("formulario", { email: req.session.email });
});

app.get("/register", (req, res) => {
  logger.info("Peticion GET a ruta '/register'")
  res.render("register");
});

app.post("/register", (req, res) => {
  logger.info("Peticion POST a ruta '/register'")
  try {
    const hashPassword = createHash(req.body.password);
    const newUser = { email: req.body.email, password: hashPassword };
    if (createUser(newUser)) {
      res.redirect("/");
    } else {
      res.render("register-error");
    }
  } catch (error) {
    res.render("register-error");
  }
});

app.post("/logout", (req, res) => {
  logger.info("Peticion POST a ruta '/logout'")
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: "false", error: err });
    }
    res.render("bye", { nombre: req.query.email });
  });
});

app.get("/register-error", (req, res) => {
  logger.info("Peticion GET a ruta '/register-error'")
  res.render("register-error");
});

app.get("/login-error", (req, res) => {
  logger.info("Peticion GET a ruta '/login-error'")
  res.render("login-error");
});

app.get("/test-mensaje", (req, res) => {
  logger.info("Peticion GET a ruta '/test-mensaje'")
  res.send(testNormalizr());
});

app.get("/productos-test", async (req, res) => {
  logger.info("Peticion GET a ruta '/productos-test'")
  res.send(fakerProducts(5));
});

app.get("/info", async (req, res) => {
  logger.info("Peticion GET a ruta '/info'")
  //La ruta info comprimida envia 946 Bytes y la ruta info sin comprimir envia 923 Bytes.
  //En este caso la compression no esta achicando mucho la informacion
  const infoData = {
    arguments: parseArgs(process.argv.slice(2)),
    plataform: process.platform,
    nodeVersion: process.version,
    rss: process.memoryUsage().rss,
    execPath: process.execPath,
    IdProcess: process.pid,
    proyectFolder: process.cwd(),
    numThreads
  };
  console.log('infoData', infoData);
  res.render("info", { infoData });
});

app.get("/api/randoms", async (req, res) => {
  logger.info("Peticion GET a ruta '/api/randoms'")
  const forked = fork("randoms.js");

  forked.on("message", (message) => {
    res.json(message);
  });

  const cantNumbers = req.query.cant || 100000000;
  forked.send({cant: parseInt(cantNumbers)})
});

app.get("/datos", (req, res) => {
  logger.info("Peticion GET a ruta '/datos'")
  console.log(`port ${PORT} -> FYH ${Date.now()}`);

  res.send(`servidor express <span style="color:blueviolet;"> (NGINX)</span> 
    en ${PORT} <b>PID: ${process.pid}</b> - ${new Date().toLocaleString()} as ${
    process.argv
  }`);
});

app.use('*',(req, res) => {
  logger.warn(`Ruta Incorrecta ${req.originalUrl}`)
  res.send(`Ruta Incorrecta ${req.originalUrl}`)
})

httpServer.listen(PORT, () =>
  console.log("servidor Levantado en el puerto " + PORT)
);
