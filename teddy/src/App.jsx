import TeddyScene from "./components/TeddyScene";
import Header from "./components/Header";

export default function App() {
  return (
    <main>
      <Header />
      <div className="bg-[#cf8b8b] min-h-screen">
        <TeddyScene />
      </div>
    </main>
  );
}