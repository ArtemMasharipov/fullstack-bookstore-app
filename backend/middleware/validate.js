/**
 * Request validation
 * validate({ params, query, body }) parses each given part with its zod schema
 * and puts the parsed values on req.valid. A failure answers 400
 * VALIDATION_FAILED with `fields`: the path of each broken field and the code
 * of the rule it broke.
 */

import { ValidationError } from "../utils/errors.js";

const PARTS = ["params", "query", "body"];

function fieldsOf(part, issues) {
  // Request keys such as __proto__ must remain ordinary field names.
  const fields = Object.create(null);
  for (const issue of issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) fields[[...issue.path, key].join(".")] = issue.code;
    } else {
      fields[issue.path.length ? issue.path.join(".") : part] = issue.code;
    }
  }
  return fields;
}

export function validate(schemas) {
  return (req, res, next) => {
    const valid = {};
    let fields = {};

    for (const part of PARTS) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part]);
      if (result.success) valid[part] = result.data;
      else fields = { ...fields, ...fieldsOf(part, result.error.issues) };
    }

    if (Object.keys(fields).length) {
      return next(new ValidationError("Validation failed", fields));
    }

    req.valid = valid;
    next();
  };
}
