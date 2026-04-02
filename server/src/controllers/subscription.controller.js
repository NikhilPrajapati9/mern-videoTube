import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // 1. Validation: Check if channelId is a valid MongoDB ID
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  // 2. Self-subscription check (User khud ko subscribe nahi kar sakta)
  if (channelId.toString() === req.user?._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  // 3. Check if subscription already exists
  const subscriptionInstance = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (subscriptionInstance) {
    // 4. If exists, Unsubscribe (Delete entry)
    await Subscription.findByIdAndDelete(subscriptionInstance._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "Unsubscribed successfully"
        )
      );
  } else {
    // 5. If not exists, Subscribe (Create entry)
    const newSubscription = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });

    if (!newSubscription) {
      throw new ApiError(500, "Something went wrong while subscribing");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isSubscribed: true }, "Subscribed successfully")
      );
  }
});

export const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: {
                url: 1,
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        _id: 1,
        subscriber: "$subscriberDetails",
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        `${subscribers.length} Subscribers fetched successfully`
      )
    );
});

export const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber ID");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: {
                url: 1,
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscribedChannel",
    },
    {
      $project: {
        _id: 1,
        channel: "$subscribedChannel",
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully"
      )
    );
});
