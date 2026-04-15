import { Request } from "express";
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req: Request, file: any, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req: Request, file:any, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({ storage });
