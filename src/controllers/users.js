const { request, response } = require('express');
const { Op } = require('sequelize');
const bcryptjs = require('bcryptjs');

// Modelos
const { User, UserRole, Role, RolePermission, Permission, Company } = require('../database/models');

const { generateJWT } = require('../helpers/jwt');
const { formatUser } = require('../helpers/users');



// Funciones del controlador

/**
 * Crear un nuevo usuario. Perteneciente a una compañía cliente
 * @param {string} name string. `body`.
 * @param {string} email string, email. `body`.
 * @param {string} password string. `body`
 * @param {integer} companyId integer. `body`
 */
const create = async (req = request, res = response) => {
   try {
      const { name, stringEmail, password } = req.body;

      const authUser = req.authUser;

      //Encriptado de contraseña
      const salt = bcryptjs.genSaltSync();
      const hashPassword = bcryptjs.hashSync(password, salt);

      const user = await User.create({ name, email: stringEmail, password: hashPassword, companyId: authUser.companyId });

      res.json(user);
   } catch (error) {
      console.log(error);
      res.status(500).json(error);
   }
}

/**
 * Listar usuarios registrados.
 * @param {integer} skip integer, cantidad de resultados a omitir (Paginación). `query`
 * @param {integer} limit integer, cantidad de resultados límite (Paginación). `query`
 */
const findAll = async (req = request, res = response) => {
   try {
      const { skip, limit } = req.query;

      const user = req.authUser;

      const where = user.isAdmin
         ?
         { companyId: { [Op.is]: null } }
         :
         { companyId: user.companyId }

      if (limit) {
         const { rows, count } = await User.findAndCountAll({
            where,
            offset: Number(skip),
            limit: Number(limit),
            order: [
               ['name', 'ASC']
            ]
         });

         const pages = Math.ceil(count / Number(limit));

         res.json({
            rows,
            count,
            pages
         });
      } else {
         const users = await User.findAll({
            where,
            order: [
               ['name', 'ASC']
            ]
         });
   
         res.json(users);
      }
   } catch (error) {
      console.log(error);
      res.status(500).json(error);
   }
}

/**
 * Obtener un usuario dado su id.
 * @param {integer} id integer. `params`
 */
const findById = async (req = request, res = response) => {
   try {
      const { id } = req.params;

      const authUser = req.authUser;
      
      const user = await User.findByPk(id);

      if (!user || (user.companyId !== authUser.companyId)) {
         return res.status(400).json({
            errors: [
               {
                  value: id,
                  msg: `El id: ${id} no se encuentra en la base de datos`,
                  param: 'id',
                  location: 'params'
               }
            ]
         });
      }

      res.json(user);
   } catch (error) {
      console.log(error);
      res.status(500).json(error);
   }
}

/**
 * Eliminar un usuario dado su id.
 * @param {integer} id integer. `params`
 */
const findByIdAndDelete = async (req = request, res = response) => {
   try {
      const { id } = req.params;

      const authUser = req.authUser;

      const user = await User.findByPk(id);

      if (!user || (user.companyId !== authUser.companyId)) {
         return res.status(400).json({
            errors: [
               {
                  value: id,
                  msg: `El id: ${id} no se encuentra en la base de datos`,
                  param: 'id',
                  location: 'params'
               }
            ]
         });
      }

      await user.destroy();
   
      res.json(user);
   } catch (error) {
      console.log(error);
      res.status(500).json(error);
   }
}

/**
 * Actualizar información de un usuario dado su id.
 * @param {integer} id integer. `params`
 * @param {string} name string. `body`. Opcional
 * @param {string} rut string. `body`. Opcional
 * @param {integer} city integer. `body`. Opcional
 * @param {string} address string. `body`. Opcional
 * @param {string} phone string, sin el código de país. `body`. Opcional
 * @param {string} email string, email. `body`. Opcional
 */
const findByIdAndUpdate = async (req = request, res = response) => {
   try {
      const { name, stringEmail, password, companyId } = req.body;
   
      const { id } = req.params;

      const authUser = req.authUser;

      const user = await User.findByPk(id);

      if (!user || (user.companyId !== authUser.companyId)) {
         return res.status(400).json({
            errors: [
               {
                  value: id,
                  msg: `El id: ${id} no se encuentra en la base de datos`,
                  param: 'id',
                  location: 'params'
               }
            ]
         });
      }

      if (name) {
         user.name = name.toLocaleLowerCase();
      }

      if (stringEmail) {
         user.email = stringEmail;
      }

      if (password) {
         //Encriptado de contraseña
         const salt = bcryptjs.genSaltSync();
         const hashPassword = bcryptjs.hashSync(password, salt);

         user.password = hashPassword;
      }

      if (companyId) {
         user.companyId = companyId;
      }

      await user.save();

      res.json(user);
   } catch (error) {
      console.log(error);
      res.status(500).json(error);
   }
}

/**
 * Restaurar un usuario dado su id.
 * @param {integer} id integer. `params`
 */
const findByIdAndRestore = async (req = request, res = response) => {
   try {
      const { id } = req.params;

      const authUser = req.authUser;

      const user = await User.findByPk(id, { paranoid: false });

      if (!user || (user.companyId !== authUser.companyId)) {
         return res.status(400).json({
            errors: [
               {
                  value: id,
                  msg: `El id: ${id} no se encuentra en la base de datos`,
                  param: 'id',
                  location: 'params'
               }
            ]
         });
      }

      if (!user.deletedAt) {
         return res.status(400).json({
            errors: [
               {
                  value: id,
                  msg: `El id: ${id} no ha sido eliminado`,
                  param: 'id',
                  location: 'params'
               }
            ]
         });
      }

      await user.restore();
   
      res.json(user);
   } catch (error) {
      console.log(error);
      res.status(500).json(error);
   }
}

/**
 * Autenticación de usuario usando email y clave
 * @param {string} email string. `body` 
 * @param {string} password string. `body` 
 * @returns 
 */
const login = async (req = request, res = response) => {
   // Obteniendo los datos de inicio de sesión
   const { email, password } = req.body;

   try {

      let user = await User.findOne({
         where: { email: email.toLocaleLowerCase() },
         include: [
            {
               model: Company,
               as: 'company'
            },
            {
               model: UserRole,
               as: 'userRoles',
               include: {
                  model: Role,
                  as: 'role',
                  include: {
                     model: RolePermission,
                     as: 'rolePermissions',
                     include: {
                        model: Permission,
                        as: 'permission'
                     }
                  }
               }
            }
         ]
      });

      if (!user) {
         return res.status(400).json({
            errors: [
               {
                  value: email,
                  msg: 'Email no existe o fue eliminado',
                  param: 'email',
                  location: 'body'
               }
            ]
         });
      }

      // Verificar password
      const validPassword = bcryptjs.compareSync(password, user.password);

      if (!validPassword) {
         return res.status(400).json({
            errors: [
               {
                  value: password,
                  msg: 'Contraseña incorrecta',
                  param: 'password',
                  location: 'body'
               }
            ]
         });
      }

      // Generar JWT
      const token = await generateJWT(user.id, user.email);

      res.json({
         user: formatUser(user),
         token
      });


   } catch (error) {
      console.log(error);
      return res.status(500).json(error);
   }
}

/**
 * Obtener la data del usuario a través de jwt (JsonWebToken)
 * @param {string} x-token string. `headers`
 */
const renew = async (req = request, res = response) => {
   const user = req.authUser;

   // Generar JWT
   const token = await generateJWT(user.id, user.email);

   res.json({
      user,
      token
   });
}



// Exports
module.exports = {
   create,
   findAll,
   findById,
   findByIdAndDelete,
   findByIdAndRestore,
   findByIdAndUpdate,
   login,
   renew,
}