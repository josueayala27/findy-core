import { Hono } from "hono";
// import { cors } from "hono/cors";
import { authRoute } from "./src/routes/auth.route";
import { meRoute } from "./src/routes/me.route";
import { placesRoute } from "./src/routes/places.route";
import { clickedPlacesRoute } from "./src/routes/clicked-places.route";
import { placeListsRoute, sharedPlaceListsRoute } from "./src/routes/place-lists.route";
import { placeReviewsRoute, myReviewsRoute } from "./src/routes/place-reviews.route";

import { errorHandler } from "./src/middleware/error-handler";

const app = new Hono();

// app.use(
//   "*",
//   cors({
//     origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
//     allowHeaders: ["Content-Type", "Authorization"],
//     allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     credentials: true,
//   }),
// );

app.onError(errorHandler);

app.get("/", (c) => c.text("Hello, Hono with Nitro!"));

app.route("/auth", authRoute);
app.route("/me", meRoute);
app.route("/me", myReviewsRoute);
app.route("/places", placeReviewsRoute);
app.route("/places", placesRoute);
app.route("/clicked-places", clickedPlacesRoute);
app.route("/place-lists", placeListsRoute);
app.route("/shared", sharedPlaceListsRoute);

export default app;
