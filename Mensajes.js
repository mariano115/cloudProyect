const messageModel = require("./models/Message.model");
const { loggerDeclaration } = require("./utils");

const logger = loggerDeclaration()

const getMensajes = async () => {
  return await messageModel.find();
};

const addMensaje = async (mensaje) => {
  try {
    const mensGuardar = new messageModel(mensaje);
    mensGuardar.save();
    console.log("Mensaje guardado", mensGuardar);
  } catch (error) {
    console.log("error", error);
    logger.error('Fallo en la crecion de un nuevo mensaje ', error)
  }
};

module.exports = { addMensaje, getMensajes };
