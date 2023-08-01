const express = require("express");
const next = require("next");
const { createProxyMiddleware } = require("http-proxy-middleware");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
//passes all incoming req to server side rendering
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = express();
    // apply proxy in dev mode
    if (dev) {
      server.use(
        "/api",
        createProxyMiddleware({
          target: "http://localhost:8000",
          changeOrigin: true,
        })
      );
    }

    //mount all http requests -get,put,post
    server.all("*", (req, res) => {
      return handle(req, res);
    });

    server.listen(3000, (err) => {
      if (err) throw err;
      console.log("> Ready on http://localhost:8000");
    });
  })
  .catch((err) => {
    console.log("Error", err);
  });
