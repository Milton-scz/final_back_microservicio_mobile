const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const fs = require('fs');
const cors = require("cors");
const multer = require("multer");
const activo = require("./models/activo");
const Categoria = require("./models/categoria");
const path = require("path");
mongoose.set("strictQuery", true);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://milton:CMVkfvcDuGJkntkR@backmicroserviciomobile.dq7ueha.mongodb.net/?retryWrites=true&w=majority&appName=backmicroserviciomobile";//"mongodb://127.0.0.1:27017/db_microservicio-mobile";

const corsOptions ={
  origin:'*', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}
const app = express();
app.use(express.json());
app.use(cors(corsOptions)) 
app.use(express.json({ limit: "16mb" }));
const server = http.createServer(app);
mongoose.connect(MONGODB_URI);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Configurar multer para la subida de imágenes
// Configuración de multer para almacenar los archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  
  const upload = multer({ storage });
// agregar 
app.post("/add-activo", upload.single('urlPhoto'), async (req, res) => {
    const { nombre, descripcion, fechaAdquisicion, precio, estado, categoria } = req.body;
    const host = req.headers.host;
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;
    const urlPhoto = req.file ? `${baseUrl}/uploads/${req.file.filename}` : '';
    console.log('recibido')
    try {
      const categoriaEncontrada = await Categoria.findOne({ nombre: categoria });
      if (!categoriaEncontrada) {
        return res.status(404).json({ mensaje: 'Categoría no encontrada' });
      }
      const newActivo = new activo({
        nombre,
        descripcion,
        fechaAdquisicion,
        precio,
        estado,
        categoria: categoriaEncontrada,
        urlPhoto,
      });
      await newActivo.save();
      return res.status(200).json({
        status: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: false,
        mensaje: 'Error al guardar el activo',
      });
    }
  });
app.get('/get-categorias', async (req, res) => {
  try {
      const categorias = await Categoria.find().select('-__v');
      res.status(200).json(categorias);
  } catch (error) {
      res.status(500).json({
          mensaje: 'Error al obtener categorias',
          error
      });
  }
});

//Obtner todos los activos
//Obtner todos los activos
app.get('/getActivos', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  try {
    const activos = await activo.find()
      .select('-__v')
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const totalActivos = await activo.countDocuments();
    const totalPages = Math.ceil(totalActivos / pageSize);

    res.status(200).json({
      data: activos,
      pagination: {
        totalActivos,
        totalPages,
        currentPage: page,
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener activos',
      error,
    });
  }
});

//agregar categoria
app.post("/add-categoria", async (req, res) => {
    const {nombre,descripcion} = req.body;
    try {
      const newCategoria = new Categoria({
        nombre: nombre,
          descripcion: descripcion
      }); 
      newCategoria.save();
      return res.status(200).json({
        status: true
      });
    } catch (error) {
      console.log(error);
    }
});
const directorioUploads = 'uploads/';
const eliminarArchivoPorNombre = (nombreArchivo) => {
    const rutaArchivo = directorioUploads + nombreArchivo;
    fs.unlink(rutaArchivo, (error) => {
        if (error) {
            console.error('Error al eliminar el archivo:', error);
        } else {
            console.log('Archivo eliminado correctamente:', nombreArchivo);
        }
    });
};
// eliminar activo
app.post("/delete-activo/:_id", async (req, res) => {
    try {
        const activoEliminado = await activo.findById(req.params._id);
        if (!activoEliminado) {
            return res.status(404).json({ mensaje: 'Activo no encontrado' });
        }

        const urlPhoto = activoEliminado.urlPhoto;
        const nombreArchivo = path.basename(urlPhoto);
        console.log(nombreArchivo);
        eliminarArchivoPorNombre(nombreArchivo);
        await activo.findByIdAndDelete(req.params._id);
        return res.status(200).json({ status: true, mensaje: 'Activo eliminado correctamente' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, mensaje: 'Error al eliminar activo' });
    }
});

app.get("/get-activo/:id", async (req, res) => {
    try {
        const activoEncontrado = await activo.findById(req.params.id).select('-__v');
        if (!activoEncontrado) {
            return res.status(404).json({ mensaje: 'Activo no encontrado' });
        }
        
        return res.status(200).json(activoEncontrado );
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al obtener activo' });
    }
});


mongoose.connection.on("connected", async () => {
  console.log("Mongoose is connected!!!!");
});

server.listen(PORT, function () {
  console.log("running"+PORT);
  
});