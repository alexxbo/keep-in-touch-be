import {NextFunction, Request, Response} from 'express';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    //TODO: Implement get all users logic
    console.log('Fetching all users');
    const users = [
      // This is a placeholder. Replace with actual database query.
      {id: '1', name: 'John Doe', email: 'john.doe@example.com'},
      {id: '2', name: 'Jane Smith', email: 'jane.smith@example.com'},
    ];
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
    //TODO: Implement get user by ID logic
    console.log(`Fetching user with ID: ${req.params.id}`);
    const user = null;
    if (!user) {
      return res.status(404).json({message: 'User not found'});
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
      return res.status(400).json({message: 'Name and email are required.'});
    }
    //TODO: Implement create logic
    console.log(`Creating user with name: ${name} and email: ${email}`);
    res.status(201).json({
      id: 'testing-id',
      name,
      email,
    });
  } catch (error) {
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
    //TODO: Implement update logic
    console.log('Updating user with data:', {name, email});
    console.log(`Updating user with ID: ${req.params.id}`);
    const updatedUser = null; // Replace with actual update logic
    if (!updatedUser) {
      return res.status(404).json({message: 'User not found'});
    }
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    //TODO: Implement delete logic
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
