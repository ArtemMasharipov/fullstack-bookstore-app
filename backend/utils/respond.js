/**
 * Success responses: { success: true, data, pagination? }
 */

export function ok(res, data, { status = 200, pagination } = {}) {
  return res
    .status(status)
    .json({ success: true, data, ...(pagination && { pagination }) });
}
