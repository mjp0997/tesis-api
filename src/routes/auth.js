const { Router } = require('express');
const { body, param } = require('express-validator');

const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT, validateResetJWT } = require('../middlewares/validate-jwt');
const { validateUniqueEmail } = require('../middlewares/custom-express');

const {
   login,
   renew,
   findByJWTAndUpdate,
   findByJWTAndUpdatePassword,
   findByEmailAndPasswordRecovery,
   updatePasswordByToken,
} = require('../controllers/users');



const router = Router();

// Rutas

// Login
router.post('/login', [
   body('password')
      .not().isEmpty().withMessage('La contraseña es obligatoria').bail()
      .isLength({ min: 8 }).withMessage('La contraseña debe contener mínimo 8 caracteres'),

   body('email')
      .not().isEmpty().withMessage('El email es obligatorio').bail()
      .isEmail().withMessage('El email es inválido').bail(),

   validateFields
], login);

// Renew connection
router.get('/renew', [
   validateJWT
], renew);

// Restaurar contraseña
router.post('/password-recovery', [
   body('email')
      .not().isEmpty().withMessage('El email es obligatorio').bail()
      .isEmail().withMessage('El email es inválido').bail(),

   validateFields
], findByEmailAndPasswordRecovery);

// Resetear contraseña
router.post('/password-reset', [
   validateResetJWT,
   
   body('password')
      .not().isEmpty().withMessage('La contraseña es obligatoria').bail()
      .isLength({ min: 8 }).withMessage('La contraseña debe contener mínimo 8 caracteres'),

   validateFields
], updatePasswordByToken);

// Actualizar contraseña
router.put('/password', [
   validateJWT,

   body('oldPassword')
      .not().isEmpty().withMessage('La contraseña actual es obligatoria').bail()
      .isLength({ min: 8 }).withMessage('La contraseña debe contener mínimo 8 caracteres'),

   body('newPassword')
      .not().isEmpty().withMessage('La nueva contraseña es obligatoria').bail()
      .isLength({ min: 8 }).withMessage('La contraseña debe contener mínimo 8 caracteres'),
   
   validateFields
], findByJWTAndUpdatePassword);

// Actualizar atributos de un usuario autenticado
router.put('/:id', [
   validateJWT,

   param('id')
      .not().isEmpty().withMessage('El id es obligatorio').bail()
      .isInt({min: 1}).withMessage('El id es inválido'),

   body('firstName').optional()
      .isAlpha('es-ES', { ignore: ' '}).withMessage('El nombre debe contener solo letras'),

   body('lastName').optional()
      .isAlpha('es-ES', { ignore: ' '}).withMessage('El apellido debe contener solo letras'),

   body('email').optional()
      .isEmail().withMessage('El email es inválido').bail()
      .custom((name, { req }) => validateUniqueEmail(name, { modelName: 'User', req, isUpdate: true })),
   
   validateFields
], findByJWTAndUpdate);



// Exports
module.exports = {
   name: 'auth',
   router
};