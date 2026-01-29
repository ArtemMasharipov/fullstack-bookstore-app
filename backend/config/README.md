# Config

- **default.js** — env-based config (port, db, jwt, cors)
- **database.js** — MongoDB connection
- **index.js** — exports

```js
import { config, connectDatabase } from './config/index.js'
await connectDatabase()
app.listen(config.port)
```

Env: `MONGODB_URI` or `MONGODB_URL` + `DATABASE_NAME`
