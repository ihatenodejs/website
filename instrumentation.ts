import { configureSync, getConsoleSink } from "@logtape/logtape";
import { prettyFormatter } from "@logtape/pretty";

const isDevelopment = process.env.NODE_ENV === "development";

export function register() {
  configureSync({
    sinks: {
      console: getConsoleSink({ formatter: prettyFormatter }),
    },
    loggers: [
      {
        category: ["app"],
        lowestLevel: isDevelopment ? "debug" : "info",
        sinks: ["console"],
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
    ],
  });
}
