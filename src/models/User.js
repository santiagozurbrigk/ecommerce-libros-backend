const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  carrera: {
    type: String,
    required: false, // Campo para colegio (opcional)
  },
  telefono: {
    type: String,
    required: false, // Ahora es obligatorio en el frontend
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
