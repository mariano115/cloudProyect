const userModel = require("./models/User.model");

const existUser = async (email) => {
  return await userModel.findOne({email: email})
};

const createUser = async (userToCreate) => {
  try {
    if(await existUser(userToCreate.email) != null){
      return false;
    }else{
      const newUser = new userModel(userToCreate);
      newUser.save();
      console.log("Usuario Creado", newUser);
      return true;
    }
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = { createUser, existUser };
