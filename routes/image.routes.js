const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploads');
const {
  uploadImage,
  cropImage,
  resizeImage,
  compressImage,
  downloadProcessedImage,
  downloadOriginalImage,
  getImagePreview,
  getImageInfo,
  cleanupOldImages
} = require('../controllers/image.edit');

// Upload image
router.post('/upload', upload.single('image'), uploadImage);

// Get image preview
router.get('/:id/preview', getImagePreview);

// Get image info
router.get('/:id/info', getImageInfo);

// Crop image
router.post('/:id/crop', cropImage);

// Resize image
router.post('/:id/resize', resizeImage);

// Compress image
router.post('/:id/compress', compressImage);

// Download processed image
router.get('/processed/:filename', downloadProcessedImage);

// Download original image
router.get('/:id/download', downloadOriginalImage);

// Cleanup (optional)
router.delete('/cleanup', cleanupOldImages);

module.exports = router;