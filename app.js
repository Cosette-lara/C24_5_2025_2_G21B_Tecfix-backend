const express = require('express');
const cors = require('cors'); 
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*', // Permite solicitudes desde CUALQUIER origen (para desarrollo)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Permite todos los métodos
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'] // Permite tus cabeceras
}));

app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Importar el ENRUTADOR PRINCIPAL
const apiRoutes = require('./routes/index'); 

//Usar las rutas
app.use('/api', apiRoutes); // Todas tus rutas ahora comienzan con /api

//Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});