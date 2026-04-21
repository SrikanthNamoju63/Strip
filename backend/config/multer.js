const multer = require('multer');
const path = require('path');

const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/octet-stream';

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        console.log('Multer Rejected:', file.originalname, file.mimetype);
        cb('Error: Images Only!');
    }
}

module.exports = upload;
