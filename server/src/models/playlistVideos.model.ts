import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistVideoSchema = new Schema(
  {
    playlistId: {
      type: Schema.Types.ObjectId,
      ref: "Playlist",
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  },
  {
    timestamps: true,
  }
);

playlistVideoSchema.plugin(mongooseAggregatePaginate);

export const PlaylistVideo = mongoose.model(
  "PlaylistVideo",
  playlistVideoSchema
);
