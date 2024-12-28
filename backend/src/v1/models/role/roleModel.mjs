import mongoose from 'mongoose';
import { ALL_PERMISSIONS } from '../../../../services/permissions-handler/permissionsConst.mjs';

const { Schema } = mongoose;

const roleSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  permissions: [{
    type: String,
    enum: ALL_PERMISSIONS,
    required: true,
  }],
});

const Role = mongoose.model('Role', roleSchema);
export default Role;
