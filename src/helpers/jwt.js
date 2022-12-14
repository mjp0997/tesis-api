const jwt = require('jsonwebtoken');



// Funciones

// Generar jsonwebtoken
const generateJWT = (id = '', email = '') => {
   return new Promise((resolve, reject) => {
      jwt.sign({ id, email }, process.env.SECRETORPRIVATEKEY, {
         // Tiempo de expiración
         // expiresIn: '6h'
      }, (err, token) => {
         if(err) {
            console.log(err);
            reject('No se pudo generar el JWT');
         } else {
            resolve(token);
         }
      });
   });
}



// Exportando funciones
module.exports = {
   generateJWT
}