import { Hono } from "hono";
import { authRoute } from "./src/routes/auth.route";
import { meRoute } from "./src/routes/me.route";
import { errorHandler } from "./src/middleware/error-handler";

const app = new Hono();

app.onError(errorHandler);

app.get("/", (c) => c.text("Hello, Hono with Nitro!"));

app.route("/auth", authRoute);
app.route("/me", meRoute);

export default app;
