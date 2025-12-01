import ReactDOM from "react-dom/client";
import "@/shared/polyfills/buffer";
import "@mysten/dapp-kit/dist/index.css";
import "./index.css";

import { AppProviders } from "./app/providers";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <App />
  </AppProviders>
);
