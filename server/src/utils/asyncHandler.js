// yaha arraow function dusrre arrow function ko return kar raha hai function returning function
//ye ek Higher Order Function hai
export const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
};

// export const asyncHandler = (fn) => {() => {}}

/*
export const asyncHandler = (fn) => async (req, res, next) => { 
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
*/

