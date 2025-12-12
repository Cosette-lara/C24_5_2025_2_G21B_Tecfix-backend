const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', require('./routes/index'));

app.listen(3000, () => console.log('🚀 Server en puerto 3000'));