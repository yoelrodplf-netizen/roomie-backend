const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  correo_electronico: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  nombre_perfil: { type: String, required: true },
  edad: { type: Number, required: true },
  genero: { type: String },
  profesion: { type: String },
  rol: { 
    type: String, 
    enum: ['OFERENTE', 'BUSCADOR', 'AMBOS'], 
    default: 'AMBOS' 
  },
  bio: { type: String, maxlength: 120, default: '' },
  fotos_perfil: [{ type: String }],
  fotos_propiedad: [{ type: String }],
  habito_limpieza_nivel: { type: Number, default: 50 },
  nivel_ruido_nivel: { type: Number, default: 50 },
  consumo_alcohol_nivel: { type: Number, default: 0 },
  frecuencia_invitados_nivel: { type: Number, default: 30 },
  horario_vida: { type: String },
  es_fumador: { type: Boolean, default: false },
  mascotas: { type: String },
  presupuesto_max_renta: { type: String },
  fecha_mudanza_min: { type: String },
  fecha_mudanza_max: { type: String },
  ubicacion_preferida: { type: String, default: '' },
  tipo_propiedad: { type: String },
  es_amueblada: { type: Boolean, default: false },
  quiere_bano_propio: { type: Boolean, default: false },
  servicios_incluidos: [String],
  caracteristicas_adicionales: [String],
  hobbies: [String],
  filosofia_vida: { type: String },
  habilidades_intereses: [String],
  descripcion_roomie_ideal: { type: String },
  expectativas_hogar: { type: String },
  descripcion_personal: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);