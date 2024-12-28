export const setupErrorHandling = (app) => {
	// Обробка 404 помилки
	app.use((req, res, next) => {
		res.status(404).render('error', { message: 'Page not found', error: {} });
	});

	// Глобальна обробка помилок
	app.use((err, req, res, next) => {
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};
		res.status(err.status || 500);
		res.render('error');
	});
};
