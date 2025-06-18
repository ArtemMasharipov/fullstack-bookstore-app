/**
 * Base MongoDB CRUD Manager
 * Provides common database operations for Mongoose models
 */
export class MongooseCRUDManager {
  constructor(model) {
    this.model = model
  }

  async create(data) {
    try {
      const document = new this.model(data)
      return await document.save()
    } catch (error) {
      throw new Error(
        `Error creating ${this.model.modelName}: ${error.message}`
      )
    }
  }

  async findById(id, populateFields = []) {
    try {
      let query = this.model.findById(id)

      if (populateFields.length > 0) {
        populateFields.forEach(field => {
          query = query.populate(field)
        })
      }

      return await query.exec()
    } catch (error) {
      throw new Error(
        `Error finding ${this.model.modelName} by ID: ${error.message}`
      )
    }
  }

  async findOne(filter, populateFields = []) {
    try {
      let query = this.model.findOne(filter)

      if (populateFields.length > 0) {
        populateFields.forEach(field => {
          query = query.populate(field)
        })
      }

      return await query.exec()
    } catch (error) {
      throw new Error(`Error finding ${this.model.modelName}: ${error.message}`)
    }
  }

  async findAll(filter = {}, populateFields = []) {
    try {
      let query = this.model.find(filter)

      if (populateFields.length > 0) {
        populateFields.forEach(field => {
          query = query.populate(field)
        })
      }

      return await query.exec()
    } catch (error) {
      throw new Error(
        `Error finding all ${this.model.modelName}: ${error.message}`
      )
    }
  }

  async update(id, updateData) {
    try {
      return await this.model.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
    } catch (error) {
      throw new Error(
        `Error updating ${this.model.modelName}: ${error.message}`
      )
    }
  }

  async delete(id) {
    try {
      return await this.model.findByIdAndDelete(id)
    } catch (error) {
      throw new Error(
        `Error deleting ${this.model.modelName}: ${error.message}`
      )
    }
  }

  async exists(filter) {
    try {
      return await this.model.exists(filter)
    } catch (error) {
      throw new Error(
        `Error checking existence of ${this.model.modelName}: ${error.message}`
      )
    }
  }

  async count(filter = {}) {
    try {
      return await this.model.countDocuments(filter)
    } catch (error) {
      throw new Error(
        `Error counting ${this.model.modelName}: ${error.message}`
      )
    }
  }
}
