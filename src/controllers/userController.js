const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { nombre, email, password, carrera, telefono } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Ya existe una cuenta registrada con ese email.' });
    }
    user = new User({ nombre, email, password, carrera, telefono });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const payload = { user: { id: user.id, isAdmin: user.isAdmin, nombre: user.nombre, email: user.email, telefono: user.telefono, carrera: user.carrera } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Ocurrió un error inesperado al registrar. Por favor, intenta nuevamente o contacta soporte.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'El email o la contraseña son incorrectos.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'El email o la contraseña son incorrectos.' });
    }
    const payload = { user: { id: user.id, isAdmin: user.isAdmin, nombre: user.nombre, email: user.email } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Ocurrió un error inesperado al iniciar sesión. Por favor, intenta nuevamente o contacta soporte.' });
  }
};

// Crear usuario admin inicial
exports.createAdmin = async (req, res) => {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ email: 'dzurbrigkimprenta@gmail.com' });
    if (existingAdmin) {
      return res.status(400).json({ msg: 'El usuario admin ya existe' });
    }

    // Crear usuario admin
    const adminUser = new User({
      nombre: 'Administrador',
      email: 'dzurbrigkimprenta@gmail.com',
      password: 'AdministracionImprenta2025',
      carrera: 'Administración',
      isAdmin: true
    });

    const salt = await bcrypt.genSalt(10);
    adminUser.password = await bcrypt.hash(adminUser.password, salt);
    await adminUser.save();

    res.json({ msg: 'Usuario admin creado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
};

// Listar usuarios con búsqueda avanzada
exports.getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter = {
        $or: [
          { nombre: regex },
          { email: regex },
          { carrera: regex },
          { telefono: regex },
        ],
      };
    }
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ msg: 'No se pudieron obtener los usuarios.' });
  }
}; 