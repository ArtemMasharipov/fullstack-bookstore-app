export const handleError = (res, message = 'An error occurred', status = 500) => {
	res.status(status).send(message);
};
