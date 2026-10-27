import { AppRoutes } from "./app/router";
import { Footer } from "./shared/components/layout/Footer";
import { Header } from "./shared/components/layout/Header";
import { SunsetBanner } from "./shared/components/sunset/SunsetBanner";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <SunsetBanner />
      <Header />
      <main className="flex-1">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default App;
