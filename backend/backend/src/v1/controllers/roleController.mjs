import RolesDBService from '../models/role/RolesDBService.mjs';

export const getAllRoles = async (req, res) => {
  try {
    const roles = await RolesDBService.getList();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const newRole = await RolesDBService.create(req.body);
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const deletedRole = await RolesDBService.deleteById(req.params.id);
    if (!deletedRole) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

