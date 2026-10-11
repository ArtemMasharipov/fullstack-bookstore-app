# Config

- **default.js** — env-based config (port, db, jwt, cors). `loadConfig(env)` validates an environment object and
  throws `ConfigError`, which lists every problem. The default export is the config of this process, validated when the
  module is imported, so an invalid environment stops the backend at startup
- **database.js** — MongoDB connection
- **load-env.js** — loads `.env` into `process.env`. It is imported first, and only by entry points (`server.js`, the
  seed CLI); it loads nothing when `NODE_ENV=test`
- **mongo-guard.js** — refuses a MongoDB URI whose hosts are not local (`localhost`, `127.0.0.1`, `::1`) before
  connecting, and checks the connection's host after connecting as a second layer. Used by the tests, the seed CLI
  and the e2e server
- **index.js** — exports

```js
import { config, connectDatabase } from './config/index.js'
await connectDatabase()
app.listen(config.port)
```

Env: `MONGODB_URI` or `MONGODB_URL` + `DATABASE_NAME`
