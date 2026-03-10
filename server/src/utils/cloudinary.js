import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_COULD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
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

export const deleteFromCloudinary = async (publicId, fileType) => {
  if (!publicId) {
    throw new ApiError(400, "Avatar's Public Id is missing");
  }

  let result;

  try {
    if (fileType === "video") {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "video",
      });
    } else if (fileType === "image") {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
    }

    if (result.result !== "ok" && result.result !== "not found") {
      throw new ApiError(400, "Failed to delete file");
    }
    return res;
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while deleting file from cloudinary"
    );
  }
};
