/* eslint-disable @typescript-eslint/no-explicit-any */
import {NextFunction, Request, Response} from 'express';
import {BaseError} from '../middleware/errorHandler';
import User from '../models/User';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new BaseError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {name, email} = req.body;

    if (!name || !email) {
      throw new BaseError('Name and email are required.', 400);
    }

    const newUser = new User({name, email});
    await newUser.save();

    res.status(201).json(newUser);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((val: any) => val.message)
        .join(', ');
      return next(new BaseError(message, 400));
    }
    // MongoDB duplicate key error code
    if (error.code === 11000) {
      return next(new BaseError('Email already exists.', 409));
    }
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {name, email} = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {name, email},
      {
        new: true,
        runValidators: true,
        context: 'query',
      },
    );

    if (!updatedUser) {
      throw new BaseError('User not found', 404);
    }
    res.json(updatedUser);
  } catch (error: any) {
    // Handle Mongoose validation errors or duplicate key errors on update
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((val: any) => val.message)
        .join(', ');
      return next(new BaseError(message, 400));
    }
    if (error.code === 11000) {
      return next(new BaseError('Email already exists.', 409));
    }
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      throw new BaseError('User not found', 404);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
