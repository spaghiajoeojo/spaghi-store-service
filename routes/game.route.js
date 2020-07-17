const auth = require("../middleware/auth");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const {
    License
} = require("../models/license.model");
const {
    User
} = require("../models/user.model");



const express = require("express");
const router = express.Router();


router.get("/catalog", async (req, res) => {
    const games = [];
    const baseDir = process.cwd();
    const dirs = fs.readdirSync(path.join(baseDir, "games"));
    dirs.forEach(game => {
        let entry = JSON.parse(fs.readFileSync(path.join(baseDir, "games", game, "spaghi-game.json")));
        entry.size = fs.fs
        games.push(entry);
    });
    res.send({
        games
    });
});

router.get("/:game", async (req, res) => {
    const gameConfig = getGameConfig(req.params.game);
    res.send(gameConfig);
});

router.get("/:game/verify", async (req, res) => {
    const gameConfig = getGameConfig(req.params.game);
    let updated = false;
    gameConfig.data.forEach((f) => {
        if (!f.hash) {
            generateHash(req.params.game, f);
            updated = true;
        }
    });
    if (updated) {
        writeGameConfig(req.params.game, gameConfig);
    }
    res.send(gameConfig);
});


router.get("/:game/image", async (req, res) => {
    const gameConfig = getGameConfig(req.params.game);
    res.sendFile(path.join(process.cwd(), "games", req.params.game, gameConfig.thumbnail));
});

router.get("/:game/generateLicenseCode", auth, async (req, res) => {

    if (!req.user.admin) {
        res.status(401).send("You can't do that.")
    }

    const gameConfig = getGameConfig(req.params.game);

    let license = new License({
        gameId: req.params.game,
        cost: gameConfig.price
    });
    license.save();
    res.send(license.code);
});

router.get("/:game/download/:dataIndex", auth, async (req, res) => {
    let license = await License.findOne({
        gameId: req.params.game,
        owner: req.user._id
    });
    console.log(license);
    if (license) {
        const gameConfig = getGameConfig(req.params.game);
        if (req.params.dataIndex < gameConfig.data.length) {
            const filePath = path.join(getGameDir(req.params.game), gameConfig.data[req.params.dataIndex].path);
            res.sendFile(filePath);
        } else {
            res.status(404).send({
                error: "Not Found."
            });
        }
    } else {
        res.status(401).send({
            error: "You can't download this game. Buy it."
        });
    }
});

router.get("/:game/redeem/:code", auth, async (req, res) => {
    let license = await License.findOne({
        code: req.params.code,
        owner: null
    });
    if (license && !await alreadyOwned(req.user, req.params.game)) {
        license.owner = req.user._id;
        license.save();
        res.status(200).send();
    } else {
        res.status(400).send({
            error: "Wrong code."
        });
    }
});

router.get("/:game/buy", auth, async (req, res) => {
    if (await alreadyOwned(req.user, req.params.game)) {
        res.status(400).send("Already owned.");
        return;
    }
    const gameConfig = getGameConfig(req.params.game);

    if (req.user.currency < gameConfig.price) {
        res.status(402).send({
            error: "Not enough pasta."
        });
        return;
    }

    if (gameConfig.directBuy) {
        let user = await User.findById(req.user._id);
        user.currency -= gameConfig.price;
        user.save();
        let license = new License({
            gameId: req.params.game,
            cost: gameConfig.price,
            owner: user._id
        });
        license.save();
        res.send({
            msg: "OK"
        });

    } else {
        let license = await License.findOne({
            gameId: req.params.game,
            owner: null
        });
        if (license) {
            license.owner = req.user._id;
            license.save();
            res.send({
                msg: "OK"
            });

        } else {
            res.send("Not Available");
        }
    }

});

async function alreadyOwned(user, game) {
    let license = await License.findOne({
        gameId: game,
        owner: user._id
    });
    return !!license;
}

function getGameDir(game) {
    return path.join(process.cwd(), "games", game);
}

function writeGameConfig(game, config) {
    fs.writeFileSync(path.join(getGameDir(game), "spaghi-game.json"), JSON.stringify(config, null, " ".repeat(4)));
}

function getGameConfig(game) {
    return JSON.parse(fs.readFileSync(path.join(getGameDir(game), "spaghi-game.json")));
}

function generateHash(game, gameFile) {

    console.log("generated hash: ", gameFile);
    const baseDir = getGameDir(game);

    let file = fs.readFileSync(path.join(baseDir, gameFile.path));
    const hash = crypto.createHash('md5');
    hash.update(file);
    gameFile.hash = hash.digest('hex');
}



module.exports = router;