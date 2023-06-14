import User from "../models/user";
import { nanoid } from "nanoid";

export const uploadImage = async (req, res) => {
    try {
        const { image } = req.body;
        const base64Data = new Buffer.from(
            image.replace(/^data:image\/\w+;base64,/,""),
            "base64"
        );
        console.log(base64Data);
        const type = image.split(";")[0].split("/")[1]; //toget the image format jpeg or png

        const user = await User.findById(req.user._id).exec();
        user.images.push({
            data: base64Data,
            contentType: type,
            key: `${nanoid()}.${type}`
        })

        res.send(`<img src="${image}">`);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload image' });
    }
}