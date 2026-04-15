import fs from "fs";
import { ApiError } from "./ApiError.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_COULD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // console.log("file is uploaded successfully on cloudinary.", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file.
    return null;
  }
};

export const deleteFromCloudinary = async (
  publicId: string,
  fileType: string = "image"
) => {
  try {
    if (!publicId) {
      return null;
    }
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: fileType,
      invalidate: true,
    });

    if (result.result === "ok" || result.result === "not found") {
      return result;
    } else {
      throw new Error("Cloudinary deletion failed");
    }
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while deleting file from cloudinary"
    );
  }
};
