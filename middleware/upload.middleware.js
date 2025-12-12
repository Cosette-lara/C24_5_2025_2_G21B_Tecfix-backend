const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const uploadFotosReporte = upload.fields([
    { name: 'foto_codigo', maxCount: 1 },
    { name: 'foto_averia', maxCount: 1 }
]);

module.exports = { uploadFotosReporte };