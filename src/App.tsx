import { AppRoutes } from "./app/router";
import { Footer } from "./shared/components/layout/Footer";
import { Header } from "./shared/components/layout/Header";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default App;
