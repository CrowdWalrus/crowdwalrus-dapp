import { AppRoutes } from "./app/router";
import { Header } from "./shared/components/layout/Header";

function App() {
  return (
    <>
      <Header />
      <div className="container px-4">
        <AppRoutes />
      </div>
    </>
  );
}

export default App;
