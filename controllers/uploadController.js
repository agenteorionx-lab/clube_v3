const multer = require('multer');
const fs = require('fs');
const path = require('path');
const supabase = require('../database');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Use timestamp + random + extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

exports.uploadMiddleware = upload.single('photo');

exports.updatePhoto = async (req, res) => {
    const userId = req.userId; // From Auth Middleware
    const showPhoto = req.body.showPhoto === 'true' || req.body.showPhoto === true ? 1 : 0;

    let photoUrl = null;
    if (req.file) {
        photoUrl = '/uploads/' + req.file.filename;
    }

    try {
        const updates = { show_photo: showPhoto };
        if (photoUrl) {
            updates.photo_url = photoUrl;
        }

        const { error } = await supabase
            .from('clients')
            .update(updates)
            .eq('user_id', userId);

        if (error) {
            console.error('Update Photo Error:', error);
            return res.status(500).json({ message: 'Erro ao atualizar foto/configurações.' });
        }

        res.json({ message: 'Dados atualizados com sucesso!', photoUrl: photoUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro interno ao atualizar foto' });
    }
};
