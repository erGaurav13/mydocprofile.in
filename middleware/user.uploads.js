const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "userdoc";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Document types - one file per type
const DOCUMENT_TYPES = {
  aadhaar: 'aadhaar',
  tenth: 'tenth', 
  twelfth: 'twelfth',
  graduation: 'graduation',
  category: 'category',
  disability: 'disability'
};

// Delete old file if exists
const deleteOldFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted old file: ${filePath}`);
    } catch (err) {
      console.error(`Error deleting file:`, err);
    }
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.userId || "general";
    const userFolder = path.join(uploadDir, userId);
    
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }
    cb(null, userFolder);
  },
  
  filename: function (req, file, cb) {
    const userId = req.userId || "general";
    const userFolder = path.join(uploadDir, userId);
    const docType = req.docType || 'other';
    console.log(req.body,"doct")
    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Create filename: docType-userId-timestamp.ext
    const timestamp = Date.now();
    const newFilename = `${docType}-${userId}-${timestamp}${ext}`;
    
    // Check if folder exists before reading
    if (fs.existsSync(userFolder)) {
      const oldFiles = fs.readdirSync(userFolder);
      oldFiles.forEach(oldFile => {
        if (oldFile.startsWith(`${docType}-${userId}-`)) {
          const oldFilePath = path.join(userFolder, oldFile);
          deleteOldFile(oldFilePath);
        }
      });
    }
    
    cb(null, newFilename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and PDF files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: fileFilter
});

module.exports = { uploadDoc: upload, DOCUMENT_TYPES };