import { AppRoutes } from "./app/router";
import { Header } from "./shared/components/layout/Header";

function App() {
  return (
    <>
      <Header />
      <AppRoutes />
    </>
  );
}

export default App;
