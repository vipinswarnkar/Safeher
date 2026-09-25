import ApiError from "../utils/ApiError.js";

/*
 * Validates the request with zod schemas before it reaches the controller.
 *
 *   router.post("/", validate({ body: contactSchema }), addContact)
 *
 * - body:   replaced with the parsed value (unknown fields are stripped,
 *           which also blocks mass-assignment like sending `user: ...`)
 * - query:  parsed value stored on req.validQuery (req.query is read-only in Express 5)
 * - params: parsed value stored on req.validParams
 */
const validate = (schemas) => (req, res, next) => {
  const errors = [];

  for (const part of ["body", "query", "params"]) {
    const schema = schemas[part];
    if (!schema) continue;

    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          field: [part, ...issue.path].join("."),
          message: issue.message,
        });
      }
      continue;
    }

    if (part === "body") req.body = result.data;
    if (part === "query") req.validQuery = result.data;
    if (part === "params") req.validParams = result.data;
  }

  if (errors.length > 0) {
    // First message is shown in the app's toast; full list is in `errors`
    return next(ApiError.badRequest(errors[0].message, errors));
  }

  next();
};

export default validate;
