const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const Image = require('../models/image.model');
let backendImg='https://mydocprofile-in.onrender.com'
// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

// Upload image
exports.uploadImage = async (req, res) => {
  try {
    await ensureUploadsDir();
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const image = new Image({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    await image.save();

    // Get image dimensions
    const metadata = await sharp(req.file.path).metadata();

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        id: image._id,
        filename: image.filename,
        originalName: image.originalName,
        size: image.size,
        width: metadata.width,
        height: metadata.height,
        mimetype: image.mimetype,
        previewUrl: `${backendImg}/img/${image._id}/preview`,
        downloadUrl: `${backendImg}/img/${image._id}/download`
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error uploading image' });
  }
};

// Get image preview
exports.getImagePreview = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id,"id-->")
   const image = await Image.findById(new mongoose.Types.ObjectId(id));
console.log(image,"IMAGE-->")
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Serve preview (max 800px width)
    const buffer = await sharp(image.path)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading image' });
  }
};

// Crop image
// exports.cropImage = async (req, res) => {
//   try {
//     await ensureUploadsDir();
    
//     const { id } = req.params;
//     const { x, y, width, height } = req.body;

//     const image = await Image.findById(id);
//     if (!image) {
//       return res.status(404).json({ error: 'Image not found' });
//     }

//     const processedFilename = `cropped-${Date.now()}-${image.filename}`;
//     const processedPath = path.join(__dirname, '..', 'uploads', processedFilename);

//     await sharp(image.path)
//       .extract({ 
//         left: Math.max(0, parseInt(x)), 
//         top: Math.max(0, parseInt(y)), 
//         width: Math.max(1, parseInt(width)), 
//         height: Math.max(1, parseInt(height)) 
//       })
//       .toFile(processedPath);

//     // Get processed image info
//     const stats = await fs.stat(processedPath);
//     const metadata = await sharp(processedPath).metadata();

//     const processedImage = {
//       operation: 'crop',
//       x: parseInt(x),
//       y: parseInt(y),
//       width: metadata.width,
//       height: metadata.height,
//       format: path.extname(processedPath).slice(1),
//       size: stats.size,
//       filename: processedFilename,
//       downloadUrl: `${backendImg}/img/processed/${processedFilename}`
//     };

//     // Save processed image info
//     image.processedImages.push(processedImage);
//     await image.save();

//     // Send preview of cropped image
//     const previewBuffer = await sharp(processedPath)
//       .resize({ width: 600, withoutEnlargement: true })
//       .jpeg({ quality: 80 })
//       .toBuffer();

//     res.set('Content-Type', 'image/jpeg');
//     res.send({
//       buffer: previewBuffer.toString('base64'),
//       metadata: processedImage
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error cropping image' });
//   }
// };

exports.cropImage = async (req, res) => {
  try {
    await ensureUploadsDir();
    
    const { id } = req.params;
    const { x, y, width, height } = req.body;

    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const processedFilename = `cropped-${Date.now()}-${image.filename}`;
    const processedPath = path.join(__dirname, '..', 'uploads', processedFilename);

    // Use the original image path for cropping
    const originalPath = image.path;
    
    await sharp(originalPath)
      .extract({ 
        left: Math.max(0, parseInt(x)), 
        top: Math.max(0, parseInt(y)), 
        width: Math.max(1, parseInt(width)), 
        height: Math.max(1, parseInt(height)) 
      })
      .toFile(processedPath);

    // Get processed image info
    const stats = await fs.stat(processedPath);
    const metadata = await sharp(processedPath).metadata();

    // Get the original name without path
    const originalName = image.originalName || image.originalFilename || image.filename;
    
    // Create new image document for the cropped image
    const processedImage = new Image({
      filename: processedFilename,
      originalName: originalName,  // Use originalName from source image
      originalFilename: image.originalFilename || image.filename,
      path: processedPath,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      mimeType: `image/${metadata.format}`,  // Add mimetype
      mimetype: `image/${metadata.format}`,  // Add both to be safe
      uploadedBy: image.uploadedBy,
      isProcessed: true,
      originalImageId: image._id,
      // Add any other required fields from your Image model
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await processedImage.save();

    // Send response with cropped image info
    res.json({
      success: true,
      image: {
        id: processedImage._id,
        filename: processedFilename,
        originalFilename: processedImage.originalFilename,
        originalName: processedImage.originalName,
        size: stats.size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        mimeType: `image/${metadata.format}`,
        previewUrl: `${backendImg}/img/${processedImage._id}/preview`,
        downloadUrl: `${backendImg}/img/${processedImage._id}/download`,
        processedPath: processedPath,
        createdAt: processedImage.createdAt
      }
    });
  } catch (error) {
    console.error('Crop error:', error);
    res.status(500).json({ 
      error: 'Error cropping image', 
      details: error.message,
      validationErrors: error.errors // Include validation errors for debugging
    });
  }
};
// Resize image
// exports.resizeImage = async (req, res) => {
//   try {
//     await ensureUploadsDir();
    
//     const { id } = req.params;
//     const { width, height, maintainAspectRatio = true } = req.body;

//     const image = await Image.findById(id);
//     if (!image) {
//       return res.status(404).json({ error: 'Image not found' });
//     }

//     const processedFilename = `resized-${Date.now()}-${image.filename}`;
//     const processedPath = path.join(__dirname, '..', 'uploads', processedFilename);

//     let sharpInstance = sharp(image.path);
    
//     if (maintainAspectRatio) {
//       sharpInstance = sharpInstance.resize({
//         width: width ? parseInt(width) : null,
//         height: height ? parseInt(height) : null,
//         fit: 'inside',
//         withoutEnlargement: false
//       });
//     } else {
//       sharpInstance = sharpInstance.resize({
//         width: parseInt(width) || null,
//         height: parseInt(height) || null,
//         fit: 'fill'
//       });
//     }

//     await sharpInstance.toFile(processedPath);

//     const stats = await fs.stat(processedPath);
//     const metadata = await sharp(processedPath).metadata();

//     const processedImage = {
//       operation: 'resize',
//       width: metadata.width,
//       height: metadata.height,
//       originalWidth: (await sharp(image.path).metadata()).width,
//       originalHeight: (await sharp(image.path).metadata()).height,
//       format: path.extname(processedPath).slice(1),
//       size: stats.size,
//       filename: processedFilename,
//       downloadUrl: `${backendImg}/img/processed/${processedFilename}`
//     };

//     image.processedImages.push(processedImage);
//     await image.save();

//     res.json({
//       message: 'Image resized successfully',
//       originalSize: image.size,
//       newSize: stats.size,
//       reduction: `${((1 - stats.size / image.size) * 100).toFixed(2)}%`,
//       image: processedImage
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error resizing image' });
//   }
// };

exports.resizeImage = async (req, res) => {
  try {
    await ensureUploadsDir();
    
    const { id } = req.params;
    const { width, height, maintainAspectRatio = true, quality = 80 } = req.body;

    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const processedFilename = `resized-${Date.now()}-${image.filename}`;
    const processedPath = path.join(__dirname, '..', 'uploads', processedFilename);

    let sharpInstance = sharp(image.path);
    
    // Handle resize
    if (maintainAspectRatio) {
      sharpInstance = sharpInstance.resize({
        width: width ? parseInt(width) : null,
        height: height ? parseInt(height) : null,
        fit: 'inside',
        withoutEnlargement: false
      });
    } else {
      sharpInstance = sharpInstance.resize({
        width: parseInt(width) || null,
        height: parseInt(height) || null,
        fit: 'fill'
      });
    }

    // Apply quality based on format
    const format = image.format || path.extname(image.filename).toLowerCase().slice(1);
    if (['jpg', 'jpeg'].includes(format)) {
      sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality) });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality: parseInt(quality) });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: parseInt(quality) });
    }

    await sharpInstance.toFile(processedPath);

    // Get processed image info
    const stats = await fs.stat(processedPath);
    const metadata = await sharp(processedPath).metadata();

    // Get the original name
    const originalName = image.originalName || image.originalFilename || image.filename;
    
    // Create new image document for the resized image
    const processedImage = new Image({
      filename: processedFilename,
      originalName: originalName,
      originalFilename: image.originalFilename || image.filename,
      path: processedPath,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      mimeType: `image/${metadata.format}`,
      mimetype: `image/${metadata.format}`,
      uploadedBy: image.uploadedBy,
      isProcessed: true,
      originalImageId: image._id,
      resizeData: {
        originalWidth: image.width,
        originalHeight: image.height,
        maintainAspectRatio,
        quality: parseInt(quality)
      }
    });

    const savedImage = await processedImage.save();

    // Send response - CRITICAL: Include the _id
    res.json({
      success: true,
      message: 'Image resized successfully',
      originalSize: image.size,
      newSize: stats.size,
      reduction: `${((1 - stats.size / image.size) * 100).toFixed(2)}%`,
      id: savedImage._id,  // This is what's missing
      filename: processedFilename,
      originalFilename: savedImage.originalFilename,
      originalName: savedImage.originalName,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      mimeType: `image/${metadata.format}`,
      previewUrl: `${backendImg}/img/${savedImage._id}/preview`,
      downloadUrl: `${backendImg}/img/${savedImage._id}/download`,
      originalWidth: image.width,
      originalHeight: image.height,
      quality: parseInt(quality),
      createdAt: savedImage.createdAt
    });
  } catch (error) {
    console.error('Resize error:', error);
    res.status(500).json({ 
      error: 'Error resizing image', 
      details: error.message 
    });
  }
};
// Compress/Reduce image size
exports.compressImage = async (req, res) => {
  try {
    await ensureUploadsDir();
    
    const { id } = req.params;
    const { quality = 80, format = 'jpeg' } = req.body;

    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const processedFilename = `compressed-${Date.now()}-${image.originalName.replace(/\.[^/.]+$/, '')}.${format}`;
    const processedPath = path.join(__dirname, '..', 'uploads', processedFilename);

    let sharpInstance = sharp(image.path);
    
    // Set compression based on format
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality) });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ 
          compressionLevel: Math.floor((100 - parseInt(quality)) / 10) 
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: parseInt(quality) });
        break;
      default:
        sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality) });
    }

    await sharpInstance.toFile(processedPath);

    const stats = await fs.stat(processedPath);
    const metadata = await sharp(processedPath).metadata();

    const processedImage = {
      operation: 'compress',
      format: format,
      quality: parseInt(quality),
      width: metadata.width,
      height: metadata.height,
      size: stats.size,
      filename: processedFilename,
      downloadUrl: `${backendImg}/img/processed/${processedFilename}`
    };

    image.processedImages.push(processedImage);
    await image.save();

    res.json({
      message: 'Image compressed successfully',
      originalSize: image.size,
      compressedSize: stats.size,
      reduction: `${((1 - stats.size / image.size) * 100).toFixed(2)}%`,
      image: processedImage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error compressing image' });
  }
};

// Download processed image
exports.downloadProcessedImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Check if file exists
    await fs.access(filePath);

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'File not found' });
  }
};

// Download original image
exports.downloadOriginalImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.setHeader('Content-Type', image.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${image.originalName}"`);
    
    const fileBuffer = await fs.readFile(image.path);
    res.send(fileBuffer);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'File not found' });
  }
};

// Get image info
exports.getImageInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const metadata = await sharp(image.path).metadata();

    res.json({
      id: image._id,
      filename: image.originalName,
      size: image.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha,
      processedImages: image.processedImages.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error getting image info' });
  }
};

// Clean up old processed images (optional cleanup endpoint)
exports.cleanupOldImages = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const oldImages = await Image.find({ 
      createdAt: { $lt: cutoffTime } 
    });

    for (const image of oldImages) {
      // Delete original file
      try {
        await fs.unlink(image.path);
      } catch (err) {
        console.log(`Could not delete ${image.path}:`, err.message);
      }

      // Delete processed files
      for (const processed of image.processedImages) {
        try {
          const processedPath = path.join(__dirname, '..', 'uploads', processed.filename);
          await fs.unlink(processedPath);
        } catch (err) {
          console.log(`Could not delete processed file:`, err.message);
        }
      }

      // Delete from database
      await Image.findByIdAndDelete(image._id);
    }

    res.json({
      message: `Cleaned up ${oldImages.length} images older than ${hours} hours`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cleaning up images' });
  }
};