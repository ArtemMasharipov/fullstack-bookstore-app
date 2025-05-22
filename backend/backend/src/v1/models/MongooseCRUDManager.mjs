class MongooseCRUDManager {
	constructor(model) {
		this.model = model
	}

	async getList(filter = {}, projection = null, populateFields = []) {
		try {
			let query = this.model.find(filter, projection)
			populateFields.forEach(field => {
				if (typeof field === 'string') {
					query = query.populate(field)
				} else if (typeof field === 'object' && field.fieldForPopulation && field.requiredFieldsFromTargetObject) {
					query = query.populate(field.fieldForPopulation, field.requiredFieldsFromTargetObject)
				}
			})
			const results = await query.exec()
			return results.map(doc => doc.toObject())
		} catch (err) {
			throw new Error('Error retrieving data: ' + err.message)
		}
	}

	async create(data) {
		try {
			const newItem = new this.model(data)
			return await newItem.save()
		} catch (err) {
			console.error(err)
			throw new Error('Error creating data: ' + err.message)
		}
	}

	async getById(id, populateFields = []) {
		try {
			let query = this.model.findById(id)
			populateFields.forEach(field => {
				query = query.populate(field)
			})
			return await query.exec()
		} catch (err) {
			throw new Error('Error finding data by id: ' + err.message)
		}
	}

	async findOne(filters = {}, projection = null, populateFields = []) {
		try {
			let query = this.model.findOne(filters, projection)
			populateFields.forEach(field => {
				if (typeof field === 'string') {
					query = query.populate(field)
				} else if (typeof field === 'object' && field.fieldForPopulation && field.requiredFieldsFromTargetObject) {
					query = query.populate(field.fieldForPopulation, field.requiredFieldsFromTargetObject)
				}
			})
			return await query.exec()
		} catch (err) {
			throw new Error('Error finding data by id: ' + err.message)
		}
	}

	async update(id, data) {
		try {
			return await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec()
		} catch (err) {
			throw new Error('Error updating data: ' + err.message)
		}
	}

	async deleteById(id) {
		try {
			return await this.model.findByIdAndDelete(id).exec()
		} catch (err) {
			throw new Error('Error deleting data: ' + err.message)
		}
	}
}

export default MongooseCRUDManager