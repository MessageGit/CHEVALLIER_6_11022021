const fs = require('fs');
const sauce = require('../models/sauce');

// Get all sauces in db
exports.getAllSauces = (req, res, next) => {
    sauce.find()
        .then(newSauce => res.status(200).json(newSauce))
        .catch(error => res.status(400).json({ error }));
};

// Get an specific sauce (id params)
exports.getOneSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then(newSauce => res.status(200).json(newSauce))
        .catch(error => res.status(404).json({ error }));
};

// Create new sauce
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const newSauce = new sauce({ 
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: '',
        usersDisliked: ''
    });
    newSauce.save()
        .then(() => res.status(201).json({ message: 'Nouvelle sauce insérée avec succès !' }))
        .catch(error => res.status(400).json({ error }));
};

// Update sauce existing
exports.updateSauce = (req, res, next) => {
    if(req.file) { // Delete last registered if user load a new img
        sauce.findOne({ _id: req.params.id })
            .then(newSauce => {
                const last_filename = newSauce.imageUrl.split('/images/')[1];
                fs.unlink('images/' + last_filename, () => {});
            })
            .catch(error => console.log('Echec de la suppression de l\'ancienne image.'));
    }
    setTimeout(() => {
        const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };
        sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Objet modifié !'}))
            .catch(error => res.status(400).json({ error }));
    }, 250);
};

// Delete sauce
exports.deleteSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then(newSauce => {
            const filename = newSauce.imageUrl.split('/images/')[1];
            fs.unlink('images/' + filename, () => {
            sauce.deleteOne({ _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
                .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};

// (dis)like sauce
exports.likeSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then(newSauce => {
            let i = 0;
            let already_liked = 0;
            let already_disliked = 0;
            let type_like = req.body.like;
            let user_id = req.body.userId;

            // Check if user already (dis)liked this
            let tabLikes = newSauce.usersLiked.split(',');
            while(i < tabLikes.length) {
                if(tabLikes[i] == user_id) { already_liked = 1; }
                i ++;
            }
            let tabDislikes = newSauce.usersDisliked.split(','); i = 0;
            while(i < tabDislikes.length) {
                if(tabDislikes[i] == user_id) { already_disliked = 1; }
                i ++;
            }

            // Add (dis)like
            if(type_like == 1 && already_liked == 0) {
                newSauce.usersLiked += user_id + ',';
                newSauce.likes ++; 
            }
            if(type_like == -1 && already_disliked == 0) {
                newSauce.usersDisliked += user_id + ',';
                newSauce.dislikes ++; 
            }

            // This user has already (dis)liked this product
            if(already_disliked == 1) {
                newSauce.usersDisliked = newSauce.usersDisliked.replace(user_id + ',', '');
                newSauce.dislikes --;
            }
            if(already_liked == 1) {
                newSauce.usersLiked = newSauce.usersLiked.replace(user_id + ',', '');
                newSauce.likes --;
            }

            sauce.updateOne({ _id: req.params.id }, { 
                    likes: newSauce.likes, 
                    dislikes: newSauce.dislikes, 
                    usersLiked: newSauce.usersLiked, 
                    usersDisliked: newSauce.usersDisliked
                })
                .then(() => res.status(200).json({ message: 'Updated ! '}))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
}; 